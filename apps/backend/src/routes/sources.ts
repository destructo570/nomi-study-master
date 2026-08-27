import { Hono } from "hono"
import { and, asc, eq, inArray, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { z } from "zod"

import { db } from "@workspace/db"
import { sourceAnnotations, sources } from "@workspace/db/schema"
import { toAnnotation, toSource } from "@workspace/db/serialize"
import { ANNOTATION_COLORS } from "@workspace/types"
import { normalizeLanguage } from "@workspace/types/language"

import {
  ownedNotebookIds,
  requireOwnedAnnotation,
  requireOwnedSource,
} from "../lib/ownership"
import { translateText } from "../lib/ai/generate"
import { withQuota } from "../lib/quota"
import { capture } from "../lib/posthog"
import type { AppEnv } from "../types"
import { createPresignedDownloadUrl } from "../lib/storage/r2"

const router = new Hono<AppEnv>()

const sourceUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
})

router.patch("/:id", async (c) => {
  const id = c.req.param("id")
  const userId = c.get("userId")
  await requireOwnedSource(userId, id)
  const body = sourceUpdateSchema.parse(await c.req.json())
  const [row] = await db
    .update(sources)
    .set(body)
    .where(
      and(
        eq(sources.id, id),
        inArray(sources.notebookId, ownedNotebookIds(userId)),
      ),
    )
    .returning()
  if (!row) return c.json({ error: "not_found" }, 404)
  return c.json(toSource(row))
})

router.delete("/:id", async (c) => {
  const id = c.req.param("id")
  const userId = c.get("userId")
  await requireOwnedSource(userId, id)
  await db
    .update(sources)
    .set({ archivedAt: sql`now()` })
    .where(
      and(
        eq(sources.id, id),
        inArray(sources.notebookId, ownedNotebookIds(userId)),
      ),
    )
  return c.json({ ok: true })
})

const rectSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
})

const annotationCreateSchema = z.object({
  page: z.number().int().positive(),
  color: z.enum(ANNOTATION_COLORS).default("yellow"),
  quotedText: z.string().default(""),
  comment: z.string().nullable().optional(),
  rects: z.array(rectSchema).min(1),
})

const annotationUpdateSchema = z.object({
  color: z.enum(ANNOTATION_COLORS).optional(),
  comment: z.string().nullable().optional(),
})

router.get("/:id/annotations", async (c) => {
  const id = c.req.param("id")
  await requireOwnedSource(c.get("userId"), id)
  const rows = await db
    .select()
    .from(sourceAnnotations)
    .where(eq(sourceAnnotations.sourceId, id))
    .orderBy(asc(sourceAnnotations.page), asc(sourceAnnotations.createdAt))
  return c.json(rows.map(toAnnotation))
})

router.post("/:id/annotations", async (c) => {
  const id = c.req.param("id")
  const src = await requireOwnedSource(c.get("userId"), id)
  const body = annotationCreateSchema.parse(await c.req.json())
  const [row] = await db
    .insert(sourceAnnotations)
    .values({
      id: nanoid(12),
      sourceId: id,
      notebookId: src.notebookId,
      page: body.page,
      color: body.color,
      quotedText: body.quotedText,
      comment: body.comment ?? null,
      rects: body.rects,
    })
    .returning()
  if (!row) return c.json({ error: "insert_failed" }, 500)
  return c.json(toAnnotation(row))
})

router.patch("/annotations/:annotationId", async (c) => {
  const id = c.req.param("annotationId")
  const userId = c.get("userId")
  await requireOwnedAnnotation(userId, id)
  const body = annotationUpdateSchema.parse(await c.req.json())
  const [row] = await db
    .update(sourceAnnotations)
    .set({ ...body, updatedAt: sql`now()` })
    .where(
      and(
        eq(sourceAnnotations.id, id),
        inArray(sourceAnnotations.notebookId, ownedNotebookIds(userId)),
      ),
    )
    .returning()
  if (!row) return c.json({ error: "not_found" }, 404)
  return c.json(toAnnotation(row))
})

router.delete("/annotations/:annotationId", async (c) => {
  const id = c.req.param("annotationId")
  const userId = c.get("userId")
  await requireOwnedAnnotation(userId, id)
  await db
    .delete(sourceAnnotations)
    .where(
      and(
        eq(sourceAnnotations.id, id),
        inArray(sourceAnnotations.notebookId, ownedNotebookIds(userId)),
      ),
    )
  return c.json({ ok: true })
})

router.get("/:id/file-url", async (c) => {
  const id = c.req.param("id")
  const row = await requireOwnedSource(c.get("userId"), id)
  if (row.type !== "file" || !row.storageKey) {
    return c.json({ error: "source has no file" }, 400)
  }
  const { url } = await createPresignedDownloadUrl({ key: row.storageKey })
  return c.json({ url })
})

const translateSchema = z.object({
  targetLanguage: z.string().min(2).max(8),
})

router.post("/:id/translate", async (c) => {
  const id = c.req.param("id")
  const userId = c.get("userId")
  const src = await requireOwnedSource(userId, id)

  // PDFs are excluded from translation — page layout / OCR coordinates
  // would need to be reflowed and the in-app PDF viewer doesn't have an
  // alternate-text overlay yet. Other source types (text/article/youtube
  // captions, transcribed audio/video) all have plain extractedText that
  // we can swap freely.
  if (src.type === "file" && src.mimeType === "application/pdf") {
    return c.json({ error: "PDF sources can't be translated yet." }, 400)
  }

  const body = translateSchema.parse(await c.req.json())
  const target = normalizeLanguage(body.targetLanguage)
  const original = (src.extractedText ?? src.content ?? "").trim()
  if (!original) {
    return c.json(
      { error: "Source has no extracted text to translate." },
      400,
    )
  }

  const existingTranslations =
    src.translations && typeof src.translations === "object"
      ? (src.translations as Record<string, string>)
      : {}
  if (existingTranslations[target]) {
    return c.json(toSource({ ...src, translations: existingTranslations }))
  }

  const translated = await withQuota(c, "summary.generate", () =>
    translateText({
      content: original,
      targetLanguage: target,
    }),
  )

  const nextTranslations = { ...existingTranslations, [target]: translated }
  const [row] = await db
    .update(sources)
    .set({ translations: nextTranslations })
    .where(
      and(
        eq(sources.id, id),
        inArray(sources.notebookId, ownedNotebookIds(userId)),
      ),
    )
    .returning()
  if (!row) return c.json({ error: "not_found" }, 404)

  capture({
    distinctId: userId,
    event: "ai_translation_completed",
    properties: {
      kind: "source",
      source_id: id,
      target_language: target,
      plan: c.get("userPlan"),
    },
  })

  return c.json(toSource(row))
})

export default router
