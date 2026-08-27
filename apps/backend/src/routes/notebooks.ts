import { promises as fs } from "node:fs"
import path from "node:path"

import { Hono } from "hono"
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

import { db } from "@workspace/db"
import {
  chapters,
  chatMessages,
  chatSessions,
  exams,
  flashcards,
  mindmaps,
  notebookDocs,
  notebooks,
  quizzes,
  shelves,
  sourceChunks,
  sources,
  summaries,
  type ChatCitation,
} from "@workspace/db/schema"
import {
  toChapter,
  toChatSession,
  toExam,
  toFlashcard,
  toMindmap,
  toNotebook,
  toQuiz,
  toSource,
  toSummary,
} from "@workspace/db/serialize"
import type {
  FlashcardCard,
  MindmapData,
  MindmapDepth,
  QuizQuestion,
  TutorPreset,
} from "@workspace/types"
import { isNotebookCover, randomNotebookCover } from "@workspace/types"
import {
  fileByteLimit,
  FLASHCARD_COUNTS,
  formatBytes,
  isFlashcardCountAllowed,
  isQuizCountAllowed,
  notebookLimit,
  QUIZ_COUNTS,
  totalStorageLimit,
} from "@workspace/types/plan"
import { uploadKindForMime } from "@workspace/types"
import type { Plan } from "@workspace/types"

import type { AppEnv } from "../types"
import {
  aggregateSourceContent,
  generateChatTitle,
  generateFlashcards,
  generateMindmap,
  generateQuizzes,
  generateSummary,
  translateFlashcards,
  translateMindmap,
  translateQuizzes,
  translateSummary,
} from "../lib/ai/generate"
import { normalizeLanguage } from "@workspace/types/language"
import {
  buildModelMessages,
  compactSessionIfNeeded,
} from "../lib/ai/chat-compaction"
import { TUTOR_PRESETS } from "../lib/ai/presets"
import { loadPrompt } from "../lib/ai/prompts"
import {
  ownedNotebookIds,
  requireOwnedNotebook,
  requireOwnedShelf,
  requireOwnedSourceInNotebook,
} from "../lib/ownership"
import {
  checkQuota,
  PlanLimitError,
  recordQuotaUsage,
  withQuota,
} from "../lib/quota"
import { pickNotebookEmoji } from "../lib/notebook-emoji"
import { capture, captureException } from "../lib/posthog"
import { getFileProcessQueue } from "../lib/queue"
import { getUrlIngestQueue } from "../lib/queue/url-ingest"
import { isYoutubeUrl } from "../lib/extract/youtube"
import { embedTexts } from "../lib/rag/embed"
import { searchChunks, type SearchHit } from "../lib/rag/search"
import {
  buildStorageKey,
  createPresignedUploadUrl,
  headObject,
} from "../lib/storage/r2"

const router = new Hono<AppEnv>()

async function enforceNotebookLimit(userId: string, plan: Plan) {
  const limit = notebookLimit(plan)
  if (limit < 0) return
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notebooks)
    .innerJoin(shelves, eq(shelves.id, notebooks.shelfId))
    .where(
      and(
        eq(notebooks.userId, userId),
        isNull(notebooks.archivedAt),
        isNull(shelves.archivedAt)
      )
    )
  const current = Number(row?.count ?? 0)
  if (current >= limit) {
    throw new PlanLimitError({ limitKind: "notebooks", current, limit, plan })
  }
}

async function liveStorageBytesForUser(userId: string): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${sources.fileSizeBytes}), 0)::bigint`,
    })
    .from(sources)
    .innerJoin(notebooks, eq(notebooks.id, sources.notebookId))
    .innerJoin(shelves, eq(shelves.id, notebooks.shelfId))
    .where(
      and(
        eq(notebooks.userId, userId),
        isNull(sources.archivedAt),
        isNull(notebooks.archivedAt),
        isNull(shelves.archivedAt)
      )
    )
  return Number(row?.total ?? 0)
}

/* ------------------------------------------------------------------ */
/* /notebooks                                                          */
/* ------------------------------------------------------------------ */

router.get("/recent", async (c) => {
  const userId = c.get("userId")
  const limit = Number(c.req.query("limit") ?? "5")
  const rows = await db
    .select({ nb: notebooks })
    .from(notebooks)
    .innerJoin(shelves, eq(shelves.id, notebooks.shelfId))
    .where(
      and(
        eq(notebooks.userId, userId),
        isNull(notebooks.archivedAt),
        isNull(shelves.archivedAt)
      )
    )
    .orderBy(desc(notebooks.updatedAt))
    .limit(limit)
  return c.json(rows.map((r) => toNotebook(r.nb)))
})

router.get("/", async (c) => {
  const userId = c.get("userId")
  const shelfId = c.req.query("shelfId")
  const where = shelfId
    ? and(
        eq(notebooks.userId, userId),
        eq(notebooks.shelfId, shelfId),
        isNull(notebooks.archivedAt),
        isNull(shelves.archivedAt)
      )
    : and(
        eq(notebooks.userId, userId),
        isNull(notebooks.archivedAt),
        isNull(shelves.archivedAt)
      )
  const rows = await db
    .select({ nb: notebooks })
    .from(notebooks)
    .innerJoin(shelves, eq(shelves.id, notebooks.shelfId))
    .where(where)
    .orderBy(desc(notebooks.updatedAt))
  return c.json(rows.map((r) => toNotebook(r.nb)))
})

const createSchema = z.object({
  shelfId: z.string().min(1),
  title: z.string().min(1),
  cover: z
    .string()
    .refine(isNotebookCover, { message: "Unknown cover" })
    .optional(),
  language: z.string().min(2).max(8).optional(),
})

router.post("/", async (c) => {
  const body = createSchema.parse(await c.req.json())
  const id = nanoid(8)
  const userId = c.get("userId")
  await requireOwnedShelf(userId, body.shelfId)
  await enforceNotebookLimit(userId, c.get("userPlan") as Plan)
  const [row] = await db
    .insert(notebooks)
    .values({
      id,
      shelfId: body.shelfId,
      userId,
      title: body.title,
      icon: pickNotebookEmoji(id),
      cover: body.cover ?? randomNotebookCover(),
      language: body.language ?? null,
    })
    .returning()
  await db.insert(notebookDocs).values({
    notebookId: id,
    content: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: body.title }],
        },
        { type: "paragraph" },
      ],
    },
  })
  return c.json(toNotebook(row!))
})

/* ------------------------------------------------------------------ */
/* /notebooks/from-course                                              */
/* ------------------------------------------------------------------ */

const fromCourseSchema = z.object({
  shelfId: z.string().min(1),
  title: z.string().min(1),
  cover: z
    .string()
    .refine(isNotebookCover, { message: "Unknown cover" })
    .optional(),
  tutorPreset: z.enum(["eli5", "academic", "socratic"]).optional(),
  customPrompt: z.string().optional(),
  language: z.string().min(2).max(8).optional(),
  source: z.object({
    type: z.enum(["text", "youtube"]),
    title: z.string().min(1),
    content: z.string(),
    sizeBytes: z.number().int().nonnegative().optional(),
  }),
  generateOptions: z
    .object({
      summary: z
        .object({
          depth: z.enum(["normal", "detailed"]),
          prompt: z.string().max(500).optional(),
        })
        .optional(),
      flashcards: z
        .object({
          count: z
            .number()
            .int()
            .refine(
              (n) => (FLASHCARD_COUNTS as readonly number[]).includes(n),
              {
                message: `count must be one of ${FLASHCARD_COUNTS.join(", ")}`,
              }
            ),
        })
        .optional(),
      quizzes: z
        .object({
          count: z
            .number()
            .int()
            .refine((n) => (QUIZ_COUNTS as readonly number[]).includes(n), {
              message: `count must be one of ${QUIZ_COUNTS.join(", ")}`,
            }),
        })
        .optional(),
    })
    .optional(),
})

router.post("/from-course", async (c) => {
  const body = fromCourseSchema.parse(await c.req.json())
  const plan = c.get("userPlan")
  await requireOwnedShelf(c.get("userId"), body.shelfId)
  await enforceNotebookLimit(c.get("userId"), plan as Plan)

  const opts = body.generateOptions
  if (
    opts?.flashcards &&
    !isFlashcardCountAllowed(opts.flashcards.count, plan)
  ) {
    return c.json(
      {
        error: `${opts.flashcards.count} flashcards is not available on the ${plan} plan.`,
      },
      403
    )
  }
  if (opts?.quizzes && !isQuizCountAllowed(opts.quizzes.count, plan)) {
    return c.json(
      {
        error: `${opts.quizzes.count} quiz questions is not available on the ${plan} plan.`,
      },
      403
    )
  }

  const isTextSource = body.source.type === "text"
  const shouldGenerate = isTextSource && body.source.content.trim().length > 0
  const effectiveOpts = shouldGenerate ? opts : undefined
  const tutorPreset = (body.tutorPreset ?? null) as TutorPreset | null
  const language = body.language ?? c.get("userLanguage")

  let summaryMarkdown: string | null = null
  let flashcardRows: FlashcardCard[] = []
  let quizRows: QuizQuestion[] = []

  try {
    if (effectiveOpts?.summary) {
      summaryMarkdown = await withQuota(c, "summary.generate", async () => {
        const res = await generateSummary({
          content: body.source.content,
          title: body.title,
          depth: effectiveOpts.summary!.depth,
          prompt: effectiveOpts.summary!.prompt ?? null,
          tutorPreset,
          language,
        })
        return res.markdown
      })
    }
    if (effectiveOpts?.flashcards) {
      flashcardRows = await withQuota(c, "flashcards.generate", async () => {
        const res = await generateFlashcards({
          content: body.source.content,
          title: body.title,
          count: effectiveOpts.flashcards!.count,
          tutorPreset,
          language,
        })
        return res.cards
      })
    }
    if (effectiveOpts?.quizzes) {
      quizRows = await withQuota(c, "quizzes.generate", async () => {
        const res = await generateQuizzes({
          content: body.source.content,
          title: body.title,
          count: effectiveOpts.quizzes!.count,
          tutorPreset,
          language,
        })
        return res.questions
      })
    }
  } catch (err) {
    if (err instanceof Error && err.name === "QuotaExceededError") throw err
    return c.json({ error: "AI generation failed", detail: String(err) }, 502)
  }

  const id = nanoid(8)
  const userId = c.get("userId")

  const nb = await db.transaction(async (tx) => {
    const [notebookRow] = await tx
      .insert(notebooks)
      .values({
        id,
        shelfId: body.shelfId,
        userId,
        title: body.title,
        icon: pickNotebookEmoji(id),
        cover: body.cover ?? randomNotebookCover(),
        tutorPreset: body.tutorPreset ?? null,
        customPrompt: body.customPrompt ?? null,
        language: body.language ?? null,
      })
      .returning()

    await tx.insert(notebookDocs).values({
      notebookId: id,
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: body.title }],
          },
          { type: "paragraph" },
        ],
      },
    })

    await tx.insert(sources).values({
      id: nanoid(8),
      notebookId: id,
      type: body.source.type,
      title: body.source.title,
      content: body.source.content,
    })

    if (summaryMarkdown !== null && effectiveOpts?.summary) {
      await tx.insert(summaries).values({
        id: nanoid(8),
        notebookId: id,
        depth: effectiveOpts.summary.depth,
        prompt: effectiveOpts.summary.prompt ?? null,
        markdown: summaryMarkdown,
      })
    }

    if (flashcardRows.length > 0) {
      await tx.insert(flashcards).values(
        flashcardRows.map((fc, i) => ({
          id: nanoid(8),
          notebookId: id,
          question: fc.question,
          answer: fc.answer,
          hint: fc.hint ?? null,
          order: i,
        }))
      )
    }

    if (quizRows.length > 0) {
      await tx.insert(quizzes).values(
        quizRows.map((q, i) => ({
          id: nanoid(8),
          notebookId: id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          order: i,
        }))
      )
    }

    return notebookRow!
  })

  return c.json(toNotebook(nb))
})

/* ------------------------------------------------------------------ */
/* /notebooks/:id                                                       */
/* ------------------------------------------------------------------ */

router.get("/:id", async (c) => {
  const id = c.req.param("id")
  const row = await requireOwnedNotebook(c.get("userId"), id)
  return c.json(toNotebook(row))
})

const notesDocSchema = z.object({
  type: z.literal("doc"),
  content: z.array(z.unknown()).optional().default([]),
})

const patchNotebookSchema = z
  .object({
    title: z.string().min(1).optional(),
    notes: notesDocSchema.nullable().optional(),
    cover: z
      .string()
      .refine(isNotebookCover, { message: "Unknown cover" })
      .nullable()
      .optional(),
    tutorPreset: z
      .enum(["default", "eli5", "academic", "socratic"])
      .nullable()
      .optional(),
    language: z.string().min(2).max(8).nullable().optional(),
  })
  .refine(
    (v) =>
      v.title !== undefined ||
      v.notes !== undefined ||
      v.cover !== undefined ||
      v.tutorPreset !== undefined ||
      v.language !== undefined,
    { message: "Provide at least one field to update" }
  )

router.patch("/:id", async (c) => {
  const id = c.req.param("id")
  const userId = c.get("userId")
  await requireOwnedNotebook(userId, id)
  const body = patchNotebookSchema.parse(await c.req.json())
  const patch: Record<string, unknown> = { updatedAt: sql`now()` }
  if (body.title !== undefined) patch.title = body.title
  if (body.notes !== undefined) patch.notes = body.notes
  if (body.cover !== undefined) patch.cover = body.cover
  if (body.tutorPreset !== undefined) patch.tutorPreset = body.tutorPreset
  if (body.language !== undefined) patch.language = body.language
  const [row] = await db
    .update(notebooks)
    .set(patch)
    .where(and(eq(notebooks.id, id), eq(notebooks.userId, userId)))
    .returning()
  return c.json(row ? toNotebook(row) : null)
})

router.delete("/:id", async (c) => {
  const id = c.req.param("id")
  const userId = c.get("userId")
  await requireOwnedNotebook(userId, id)
  await db
    .update(notebooks)
    .set({ archivedAt: sql`now()` })
    .where(and(eq(notebooks.id, id), eq(notebooks.userId, userId)))
  return c.json({ ok: true })
})

/* ------------------------------------------------------------------ */
/* /notebooks/:id/doc                                                  */
/* ------------------------------------------------------------------ */

router.get("/:id/doc", async (c) => {
  const id = c.req.param("id")
  await requireOwnedNotebook(c.get("userId"), id)
  const [row] = await db
    .select()
    .from(notebookDocs)
    .where(eq(notebookDocs.notebookId, id))
    .limit(1)
  return c.json(row ? (row.content as unknown) : null)
})

const docPutSchema = z.object({
  type: z.literal("doc"),
  content: z.array(z.unknown()),
})

router.put("/:id/doc", async (c) => {
  const id = c.req.param("id")
  const userId = c.get("userId")
  await requireOwnedNotebook(userId, id)
  const body = docPutSchema.parse(await c.req.json())
  await db
    .insert(notebookDocs)
    .values({ notebookId: id, content: body })
    .onConflictDoUpdate({
      target: notebookDocs.notebookId,
      set: { content: body, updatedAt: sql`now()` },
    })
  await db
    .update(notebooks)
    .set({ updatedAt: sql`now()` })
    .where(and(eq(notebooks.id, id), eq(notebooks.userId, userId)))
  return c.json({ ok: true })
})

/* ------------------------------------------------------------------ */
/* /notebooks/:id/sources                                              */
/* ------------------------------------------------------------------ */

router.get("/:id/sources", async (c) => {
  const id = c.req.param("id")
  await requireOwnedNotebook(c.get("userId"), id)
  const rows = await db
    .select()
    .from(sources)
    .where(and(eq(sources.notebookId, id), isNull(sources.archivedAt)))
    .orderBy(asc(sources.createdAt))
  return c.json(rows.map(toSource))
})

const sourceCreateSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    title: z.string().min(1),
    content: z.string(),
  }),
  z.object({
    type: z.literal("url"),
    url: z.string().url(),
    title: z.string().min(1).optional(),
  }),
])

router.post("/:id/sources", async (c) => {
  const id = c.req.param("id")
  await requireOwnedNotebook(c.get("userId"), id)
  const body = sourceCreateSchema.parse(await c.req.json())

  if (body.type === "text") {
    const [row] = await db
      .insert(sources)
      .values({
        id: nanoid(8),
        notebookId: id,
        type: "text",
        title: body.title,
        content: body.content,
        status: "ready",
      })
      .returning()
    return c.json(toSource(row!))
  }

  const detectedType = isYoutubeUrl(body.url) ? "youtube" : "article"
  const sourceId = nanoid(8)
  const [row] = await db
    .insert(sources)
    .values({
      id: sourceId,
      notebookId: id,
      type: detectedType,
      title: body.title?.trim() || body.url,
      content: "",
      sourceUrl: body.url,
      status: "processing",
    })
    .returning()

  await getUrlIngestQueue().add("ingest", { sourceId })

  return c.json(toSource(row!))
})

const uploadUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
})

router.post("/:id/sources/upload-url", async (c) => {
  const id = c.req.param("id")
  await requireOwnedNotebook(c.get("userId"), id)
  const body = uploadUrlSchema.parse(await c.req.json())

  const kind = uploadKindForMime(body.mimeType)
  if (!kind) {
    return c.json({ error: `Unsupported file type: ${body.mimeType}` }, 415)
  }

  const envOverride = Number(process.env.MAX_UPLOAD_BYTES)
  const limit =
    Number.isFinite(envOverride) && envOverride > 0
      ? envOverride
      : fileByteLimit(c.get("userPlan"), kind)
  if (body.sizeBytes > limit) {
    return c.json(
      {
        error: `File exceeds the ${formatBytes(limit)} limit.`,
      },
      413
    )
  }

  const userId = c.get("userId")
  const plan = c.get("userPlan") as Plan
  const storageCap = totalStorageLimit(plan)
  const used = await liveStorageBytesForUser(userId)
  if (used + body.sizeBytes > storageCap) {
    return c.json(
      {
        error: `Storage limit reached: ${formatBytes(used)} of ${formatBytes(storageCap)} used. Delete unused files or upgrade your plan.`,
      },
      413
    )
  }

  const sourceId = nanoid(8)
  const safeName = body.fileName.replace(/[^A-Za-z0-9._-]/g, "_")
  const storageKey = buildStorageKey("notebooks", id, sourceId, safeName)

  const { url } = await createPresignedUploadUrl({
    key: storageKey,
    contentType: body.mimeType,
    contentLength: body.sizeBytes,
  })

  const [row] = await db
    .insert(sources)
    .values({
      id: sourceId,
      notebookId: id,
      type: "file",
      title: body.fileName,
      content: "",
      mimeType: body.mimeType,
      fileName: body.fileName,
      fileSizeBytes: body.sizeBytes,
      storageKey,
      status: "pending_upload",
    })
    .returning()

  return c.json({
    source: toSource(row!),
    uploadUrl: url,
    storageKey,
  })
})

const completeUploadSchema = z.object({
  title: z.string().min(1).max(255).optional(),
})

router.post("/:id/sources/:sourceId/complete-upload", async (c) => {
  const notebookId = c.req.param("id")
  const sourceId = c.req.param("sourceId")
  const userId = c.get("userId")
  const body = completeUploadSchema.parse(await c.req.json().catch(() => ({})))

  const row = await requireOwnedSourceInNotebook(userId, sourceId, notebookId)

  if (row.type !== "file" || !row.storageKey) {
    return c.json({ error: "source is not a file upload" }, 400)
  }
  if (row.status !== "pending_upload") {
    return c.json(toSource(row))
  }

  const head = await headObject(row.storageKey)
  if (!head) {
    return c.json({ error: "upload not found in storage" }, 409)
  }
  if (head.contentLength !== row.fileSizeBytes) {
    return c.json({ error: "uploaded file size does not match" }, 409)
  }

  const [updated] = await db
    .update(sources)
    .set({
      status: "processing",
      title: body.title ?? row.title,
      errorMessage: null,
    })
    .where(
      and(
        eq(sources.id, sourceId),
        inArray(sources.notebookId, ownedNotebookIds(userId))
      )
    )
    .returning()

  await getFileProcessQueue().add("process", { sourceId })

  return c.json(toSource(updated!))
})

router.post("/:id/sources/:sourceId/retry", async (c) => {
  const notebookId = c.req.param("id")
  const sourceId = c.req.param("sourceId")
  const userId = c.get("userId")

  const row = await requireOwnedSourceInNotebook(userId, sourceId, notebookId)

  if (row.status === "processing" || row.status === "pending_upload") {
    return c.json(toSource(row))
  }

  const isFileSource = row.type === "file"
  const isUrlSource = row.type === "youtube" || row.type === "article"

  if (!isFileSource && !isUrlSource) {
    return c.json({ error: "this source type cannot be retried" }, 400)
  }

  if (isFileSource) {
    if (!row.storageKey) {
      return c.json({ error: "source is not a file upload" }, 400)
    }
    const head = await headObject(row.storageKey)
    if (!head) {
      return c.json(
        { error: "original file is no longer in storage; re-upload required" },
        409
      )
    }
  } else if (!row.sourceUrl) {
    return c.json({ error: "source is missing its URL" }, 400)
  }

  await db
    .delete(sourceChunks)
    .where(
      and(
        eq(sourceChunks.sourceId, sourceId),
        inArray(sourceChunks.notebookId, ownedNotebookIds(userId))
      )
    )

  const [updated] = await db
    .update(sources)
    .set({
      status: "processing",
      errorMessage: null,
      indexedAt: null,
      indexError: null,
    })
    .where(
      and(
        eq(sources.id, sourceId),
        inArray(sources.notebookId, ownedNotebookIds(userId))
      )
    )
    .returning()

  if (isFileSource) {
    await getFileProcessQueue().add("process", { sourceId })
  } else {
    await getUrlIngestQueue().add("ingest", { sourceId })
  }

  return c.json(toSource(updated!))
})

/* ------------------------------------------------------------------ */
/* /notebooks/:id/chapters                                             */
/* ------------------------------------------------------------------ */

router.get("/:id/chapters", async (c) => {
  const id = c.req.param("id")
  await requireOwnedNotebook(c.get("userId"), id)
  const rows = await db
    .select()
    .from(chapters)
    .where(eq(chapters.notebookId, id))
    .orderBy(asc(chapters.order))
  return c.json(rows.map(toChapter))
})

/* ------------------------------------------------------------------ */
/* /notebooks/:id/summary  + /summaries + /summary/generate            */
/* ------------------------------------------------------------------ */

router.get("/:id/summaries", async (c) => {
  const id = c.req.param("id")
  await requireOwnedNotebook(c.get("userId"), id)
  const rows = await db
    .select()
    .from(summaries)
    .where(eq(summaries.notebookId, id))
    .orderBy(desc(summaries.createdAt))
  return c.json(rows.map(toSummary))
})

router.get("/:id/summary", async (c) => {
  const id = c.req.param("id")
  await requireOwnedNotebook(c.get("userId"), id)
  const [row] = await db
    .select()
    .from(summaries)
    .where(eq(summaries.notebookId, id))
    .orderBy(desc(summaries.createdAt))
    .limit(1)
  return c.json(row ? toSummary(row) : null)
})

const summaryPutSchema = z.object({
  id: z.string().min(1),
  markdown: z.string(),
})

router.put("/:id/summary", async (c) => {
  const notebookId = c.req.param("id")
  await requireOwnedNotebook(c.get("userId"), notebookId)
  const body = summaryPutSchema.parse(await c.req.json())
  const [row] = await db
    .update(summaries)
    .set({ markdown: body.markdown, updatedAt: sql`now()` })
    .where(and(eq(summaries.id, body.id), eq(summaries.notebookId, notebookId)))
    .returning()
  if (!row) return c.json({ error: "Summary not found" }, 404)
  await db
    .update(notebooks)
    .set({ updatedAt: sql`now()` })
    .where(eq(notebooks.id, notebookId))
  return c.json(toSummary(row))
})

const summaryGenerateSchema = z.object({
  depth: z.enum(["normal", "detailed"]),
  prompt: z.string().max(500).optional(),
  language: z.string().min(2).max(8).optional(),
})

router.post("/:id/summary/generate", async (c) => {
  const notebookId = c.req.param("id")
  const nb = await requireOwnedNotebook(c.get("userId"), notebookId)
  const body = summaryGenerateSchema.parse(await c.req.json())
  const language = normalizeLanguage(
    body.language ?? nb.language ?? c.get("userLanguage")
  )

  // Idempotent within (notebook, language). A second language for the
  // same notebook goes through /summary/translate instead — it reuses
  // the existing markdown so it's cheaper than re-summarizing.
  const [existingSummary] = await db
    .select()
    .from(summaries)
    .where(
      and(
        eq(summaries.notebookId, notebookId),
        eq(summaries.language, language)
      )
    )
    .orderBy(desc(summaries.createdAt))
    .limit(1)
  if (existingSummary) return c.json(toSummary(existingSummary))

  const { text, count } = await aggregateSourceContent(notebookId)
  if (count === 0) {
    return c.json({ error: "No text source available to summarize yet." }, 400)
  }

  const inserted = await withQuota(c, "summary.generate", async () => {
    const result = await generateSummary({
      content: text,
      title: nb.title,
      depth: body.depth,
      prompt: body.prompt ?? null,
      tutorPreset: (nb.tutorPreset ?? null) as TutorPreset | null,
      language,
    })

    return await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(summaries)
        .values({
          id: nanoid(8),
          notebookId,
          depth: body.depth,
          prompt: body.prompt ?? null,
          markdown: result.markdown,
          language,
        })
        .returning()
      await tx
        .update(notebooks)
        .set({ updatedAt: sql`now()` })
        .where(eq(notebooks.id, notebookId))
      return row!
    })
  })

  capture({
    distinctId: c.get("userId"),
    event: "ai_generation_completed",
    properties: {
      kind: "summary",
      notebook_id: notebookId,
      depth: body.depth,
      has_prompt: !!body.prompt,
      tutor_preset: nb.tutorPreset ?? null,
      plan: c.get("userPlan"),
    },
  })

  return c.json(toSummary(inserted))
})

const translateSchema = z.object({
  targetLanguage: z.string().min(2).max(8),
})

router.post("/:id/summary/translate", async (c) => {
  const notebookId = c.req.param("id")
  await requireOwnedNotebook(c.get("userId"), notebookId)
  const body = translateSchema.parse(await c.req.json())
  const target = normalizeLanguage(body.targetLanguage)

  const [existing] = await db
    .select()
    .from(summaries)
    .where(
      and(eq(summaries.notebookId, notebookId), eq(summaries.language, target))
    )
    .limit(1)
  if (existing) return c.json(toSummary(existing))

  const [source] = await db
    .select()
    .from(summaries)
    .where(eq(summaries.notebookId, notebookId))
    .orderBy(desc(summaries.createdAt))
    .limit(1)
  if (!source) {
    return c.json(
      { error: "No summary to translate. Generate one first." },
      400
    )
  }

  const inserted = await withQuota(c, "summary.generate", async () => {
    const result = await translateSummary({
      markdown: source.markdown,
      sourceLanguage: source.language,
      targetLanguage: target,
    })
    return await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(summaries)
        .values({
          id: nanoid(8),
          notebookId,
          depth: source.depth,
          prompt: source.prompt,
          markdown: result.markdown,
          language: target,
        })
        .returning()
      await tx
        .update(notebooks)
        .set({ updatedAt: sql`now()` })
        .where(eq(notebooks.id, notebookId))
      return row!
    })
  })

  capture({
    distinctId: c.get("userId"),
    event: "ai_translation_completed",
    properties: {
      kind: "summary",
      notebook_id: notebookId,
      source_language: source.language,
      target_language: target,
      plan: c.get("userPlan"),
    },
  })

  return c.json(toSummary(inserted))
})

/* ------------------------------------------------------------------ */
/* /notebooks/:id/flashcards + generate                                */
/* ------------------------------------------------------------------ */

router.get("/:id/flashcards", async (c) => {
  const id = c.req.param("id")
  await requireOwnedNotebook(c.get("userId"), id)
  const rows = await db
    .select()
    .from(flashcards)
    .where(eq(flashcards.notebookId, id))
    .orderBy(asc(flashcards.order), asc(flashcards.createdAt))
  return c.json(rows.map(toFlashcard))
})

const flashcardCreateSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  hint: z.string().nullable().optional(),
  order: z.number().int().optional(),
})

router.post("/:id/flashcards", async (c) => {
  const id = c.req.param("id")
  await requireOwnedNotebook(c.get("userId"), id)
  const body = flashcardCreateSchema.parse(await c.req.json())
  const [row] = await db
    .insert(flashcards)
    .values({
      id: nanoid(8),
      notebookId: id,
      question: body.question,
      answer: body.answer,
      hint: body.hint ?? null,
      order: body.order ?? 0,
    })
    .returning()
  return c.json(toFlashcard(row!))
})

const flashcardGenerateSchema = z.object({
  count: z
    .number()
    .int()
    .refine((n) => (FLASHCARD_COUNTS as readonly number[]).includes(n), {
      message: `count must be one of ${FLASHCARD_COUNTS.join(", ")}`,
    }),
  prompt: z.string().trim().max(500).optional(),
  language: z.string().min(2).max(8).optional(),
})

router.post("/:id/flashcards/generate", async (c) => {
  const notebookId = c.req.param("id")
  const nb = await requireOwnedNotebook(c.get("userId"), notebookId)
  const body = flashcardGenerateSchema.parse(await c.req.json())
  const language = normalizeLanguage(
    body.language ?? nb.language ?? c.get("userLanguage")
  )

  // Idempotent within (notebook, language). Other languages live in
  // their own rows and are produced via /flashcards/translate.
  const existing = await db
    .select()
    .from(flashcards)
    .where(
      and(
        eq(flashcards.notebookId, notebookId),
        eq(flashcards.language, language)
      )
    )
    .orderBy(asc(flashcards.order), asc(flashcards.createdAt))
  if (existing.length > 0) return c.json(existing.map(toFlashcard))

  const { text, count: sourceCount } = await aggregateSourceContent(notebookId)
  if (sourceCount === 0) {
    return c.json(
      { error: "No text source available to generate flashcards." },
      400
    )
  }

  // Order is per-language; restart at 0 for a fresh language so the
  // study UI orders cards consistently from the first card.
  const inserted = await withQuota(c, "flashcards.generate", async () => {
    const result = await generateFlashcards({
      content: text,
      title: nb.title,
      count: body.count,
      prompt: body.prompt ?? null,
      existingQuestions: existing.map((r) => r.question),
      tutorPreset: (nb.tutorPreset ?? null) as TutorPreset | null,
      language,
    })

    return await db.transaction(async (tx) => {
      const rows = result.cards.map((fc, i) => ({
        id: nanoid(8),
        notebookId,
        question: fc.question,
        answer: fc.answer,
        hint: fc.hint ?? null,
        order: i,
        language,
      }))
      const out = await tx.insert(flashcards).values(rows).returning()
      await tx
        .update(notebooks)
        .set({ updatedAt: sql`now()` })
        .where(eq(notebooks.id, notebookId))
      return out
    })
  })

  capture({
    distinctId: c.get("userId"),
    event: "ai_generation_completed",
    properties: {
      kind: "flashcards",
      notebook_id: notebookId,
      count: body.count,
      has_prompt: !!body.prompt,
      tutor_preset: nb.tutorPreset ?? null,
      plan: c.get("userPlan"),
    },
  })

  return c.json(inserted.map(toFlashcard))
})

router.post("/:id/flashcards/translate", async (c) => {
  const notebookId = c.req.param("id")
  await requireOwnedNotebook(c.get("userId"), notebookId)
  const body = translateSchema.parse(await c.req.json())
  const target = normalizeLanguage(body.targetLanguage)

  const existingTarget = await db
    .select()
    .from(flashcards)
    .where(
      and(
        eq(flashcards.notebookId, notebookId),
        eq(flashcards.language, target)
      )
    )
    .orderBy(asc(flashcards.order), asc(flashcards.createdAt))
  if (existingTarget.length > 0) {
    return c.json(existingTarget.map(toFlashcard))
  }

  // Source set: cards in the most recently used language for this
  // notebook. Same ordering as the read endpoint.
  const allCards = await db
    .select()
    .from(flashcards)
    .where(eq(flashcards.notebookId, notebookId))
    .orderBy(desc(flashcards.createdAt))
  if (allCards.length === 0) {
    return c.json(
      { error: "No flashcards to translate. Generate them first." },
      400
    )
  }
  const sourceLanguage = allCards[0]!.language
  const sourceCards = allCards
    .filter((c) => c.language === sourceLanguage)
    .sort(
      (a, b) =>
        a.order - b.order || a.createdAt.getTime() - b.createdAt.getTime()
    )

  const inserted = await withQuota(c, "flashcards.generate", async () => {
    const result = await translateFlashcards({
      cards: sourceCards.map((c) => ({
        question: c.question,
        answer: c.answer,
        hint: c.hint,
      })),
      sourceLanguage,
      targetLanguage: target,
    })
    return await db.transaction(async (tx) => {
      const rows = result.cards.map((fc, i) => ({
        id: nanoid(8),
        notebookId,
        question: fc.question,
        answer: fc.answer,
        hint: fc.hint ?? null,
        order: i,
        language: target,
      }))
      const out = await tx.insert(flashcards).values(rows).returning()
      await tx
        .update(notebooks)
        .set({ updatedAt: sql`now()` })
        .where(eq(notebooks.id, notebookId))
      return out
    })
  })

  capture({
    distinctId: c.get("userId"),
    event: "ai_translation_completed",
    properties: {
      kind: "flashcards",
      notebook_id: notebookId,
      source_language: sourceLanguage,
      target_language: target,
      count: inserted.length,
      plan: c.get("userPlan"),
    },
  })

  return c.json(inserted.map(toFlashcard))
})

/* ------------------------------------------------------------------ */
/* /notebooks/:id/quizzes + generate                                   */
/* ------------------------------------------------------------------ */

router.get("/:id/quizzes", async (c) => {
  const id = c.req.param("id")
  await requireOwnedNotebook(c.get("userId"), id)
  const rows = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.notebookId, id))
    .orderBy(asc(quizzes.order), asc(quizzes.createdAt))
  return c.json(rows.map(toQuiz))
})

const quizCreateSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).min(2),
  correctAnswer: z.string().min(1),
  order: z.number().int().optional(),
})

router.post("/:id/quizzes", async (c) => {
  const id = c.req.param("id")
  await requireOwnedNotebook(c.get("userId"), id)
  const body = quizCreateSchema.parse(await c.req.json())
  const [row] = await db
    .insert(quizzes)
    .values({
      id: nanoid(8),
      notebookId: id,
      question: body.question,
      options: body.options,
      correctAnswer: body.correctAnswer,
      order: body.order ?? 0,
    })
    .returning()
  return c.json(toQuiz(row!))
})

const quizGenerateSchema = z.object({
  count: z
    .number()
    .int()
    .refine((n) => (QUIZ_COUNTS as readonly number[]).includes(n), {
      message: `count must be one of ${QUIZ_COUNTS.join(", ")}`,
    }),
  prompt: z.string().trim().max(500).optional(),
  language: z.string().min(2).max(8).optional(),
})

router.post("/:id/quizzes/generate", async (c) => {
  const notebookId = c.req.param("id")
  const nb = await requireOwnedNotebook(c.get("userId"), notebookId)
  const body = quizGenerateSchema.parse(await c.req.json())
  const language = normalizeLanguage(
    body.language ?? nb.language ?? c.get("userLanguage")
  )

  // Idempotent within (notebook, language).
  const existing = await db
    .select()
    .from(quizzes)
    .where(
      and(eq(quizzes.notebookId, notebookId), eq(quizzes.language, language))
    )
    .orderBy(asc(quizzes.order), asc(quizzes.createdAt))
  if (existing.length > 0) return c.json(existing.map(toQuiz))

  const { text, count: sourceCount } = await aggregateSourceContent(notebookId)
  if (sourceCount === 0) {
    return c.json(
      { error: "No text source available to generate quizzes." },
      400
    )
  }

  const inserted = await withQuota(c, "quizzes.generate", async () => {
    const result = await generateQuizzes({
      content: text,
      title: nb.title,
      count: body.count,
      prompt: body.prompt ?? null,
      existingQuestions: existing.map((r) => r.question),
      tutorPreset: (nb.tutorPreset ?? null) as TutorPreset | null,
      language,
    })

    return await db.transaction(async (tx) => {
      const rows = result.questions.map((q, i) => ({
        id: nanoid(8),
        notebookId,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        order: i,
        language,
      }))
      const out = await tx.insert(quizzes).values(rows).returning()
      await tx
        .update(notebooks)
        .set({ updatedAt: sql`now()` })
        .where(eq(notebooks.id, notebookId))
      return out
    })
  })

  capture({
    distinctId: c.get("userId"),
    event: "ai_generation_completed",
    properties: {
      kind: "quizzes",
      notebook_id: notebookId,
      count: body.count,
      has_prompt: !!body.prompt,
      tutor_preset: nb.tutorPreset ?? null,
      plan: c.get("userPlan"),
    },
  })

  return c.json(inserted.map(toQuiz))
})

router.post("/:id/quizzes/translate", async (c) => {
  const notebookId = c.req.param("id")
  await requireOwnedNotebook(c.get("userId"), notebookId)
  const body = translateSchema.parse(await c.req.json())
  const target = normalizeLanguage(body.targetLanguage)

  const existingTarget = await db
    .select()
    .from(quizzes)
    .where(
      and(eq(quizzes.notebookId, notebookId), eq(quizzes.language, target))
    )
    .orderBy(asc(quizzes.order), asc(quizzes.createdAt))
  if (existingTarget.length > 0) return c.json(existingTarget.map(toQuiz))

  const allQuizzes = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.notebookId, notebookId))
    .orderBy(desc(quizzes.createdAt))
  if (allQuizzes.length === 0) {
    return c.json(
      { error: "No quizzes to translate. Generate them first." },
      400
    )
  }
  const sourceLanguage = allQuizzes[0]!.language
  const sourceQuizzes = allQuizzes
    .filter((q) => q.language === sourceLanguage)
    .sort(
      (a, b) =>
        a.order - b.order || a.createdAt.getTime() - b.createdAt.getTime()
    )

  const inserted = await withQuota(c, "quizzes.generate", async () => {
    const result = await translateQuizzes({
      quizzes: sourceQuizzes.map((q) => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
      })),
      sourceLanguage,
      targetLanguage: target,
    })
    return await db.transaction(async (tx) => {
      const rows = result.questions.map((q, i) => ({
        id: nanoid(8),
        notebookId,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        order: i,
        language: target,
      }))
      const out = await tx.insert(quizzes).values(rows).returning()
      await tx
        .update(notebooks)
        .set({ updatedAt: sql`now()` })
        .where(eq(notebooks.id, notebookId))
      return out
    })
  })

  capture({
    distinctId: c.get("userId"),
    event: "ai_translation_completed",
    properties: {
      kind: "quizzes",
      notebook_id: notebookId,
      source_language: sourceLanguage,
      target_language: target,
      count: inserted.length,
      plan: c.get("userPlan"),
    },
  })

  return c.json(inserted.map(toQuiz))
})

/* ------------------------------------------------------------------ */
/* /notebooks/:id/mindmaps + generate                                  */
/* ------------------------------------------------------------------ */

const flowNodeSchema = z.object({
  id: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.object({ label: z.string() }),
  type: z.string().optional(),
})

const flowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string().optional(),
})

const mindmapDataSchema = z.object({
  nodes: z.array(flowNodeSchema),
  edges: z.array(flowEdgeSchema),
})

const mindmapCreateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  prompt: z.string().trim().max(500).optional(),
  data: mindmapDataSchema.optional(),
})

const mindmapGenerateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  prompt: z.string().trim().max(500).optional(),
  depth: z.enum(["shallow", "normal", "deep"]).optional(),
  language: z.string().min(2).max(8).optional(),
})

function defaultMindmapTitle(): string {
  return `Mindmap — ${new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`
}

router.get("/:id/mindmaps", async (c) => {
  const id = c.req.param("id")
  await requireOwnedNotebook(c.get("userId"), id)
  const rows = await db
    .select()
    .from(mindmaps)
    .where(eq(mindmaps.notebookId, id))
    .orderBy(desc(mindmaps.createdAt))
  return c.json(rows.map(toMindmap))
})

router.post("/:id/mindmaps", async (c) => {
  const notebookId = c.req.param("id")
  await requireOwnedNotebook(c.get("userId"), notebookId)
  const body = mindmapCreateSchema.parse(await c.req.json().catch(() => ({})))
  const data: MindmapData = body.data ?? { nodes: [], edges: [] }
  const [row] = await db
    .insert(mindmaps)
    .values({
      id: nanoid(8),
      notebookId,
      title: body.title ?? defaultMindmapTitle(),
      prompt: body.prompt ?? null,
      data,
    })
    .returning()
  return c.json(toMindmap(row!))
})

router.post("/:id/mindmaps/generate", async (c) => {
  const notebookId = c.req.param("id")
  const nb = await requireOwnedNotebook(c.get("userId"), notebookId)
  const body = mindmapGenerateSchema.parse(await c.req.json().catch(() => ({})))
  const language = normalizeLanguage(
    body.language ?? nb.language ?? c.get("userLanguage")
  )

  // Idempotent within (notebook, language).
  const [existingMindmap] = await db
    .select()
    .from(mindmaps)
    .where(
      and(eq(mindmaps.notebookId, notebookId), eq(mindmaps.language, language))
    )
    .orderBy(desc(mindmaps.createdAt))
    .limit(1)
  if (existingMindmap) return c.json(toMindmap(existingMindmap))

  const { text, count: sourceCount } = await aggregateSourceContent(notebookId)
  if (sourceCount === 0) {
    return c.json(
      { error: "No text source available to generate a mindmap." },
      400
    )
  }

  const depth: MindmapDepth = body.depth ?? "normal"
  const title = body.title ?? defaultMindmapTitle()
  const prompt = body.prompt ?? null

  const row = await withQuota(c, "mindmap.generate", async () => {
    const data = await generateMindmap({
      content: text,
      title,
      depth,
      prompt,
      tutorPreset: (nb.tutorPreset ?? null) as TutorPreset | null,
      language,
    })

    const [inserted] = await db.transaction(async (tx) => {
      const out = await tx
        .insert(mindmaps)
        .values({
          id: nanoid(8),
          notebookId,
          title,
          prompt,
          data,
          language,
        })
        .returning()
      await tx
        .update(notebooks)
        .set({ updatedAt: sql`now()` })
        .where(eq(notebooks.id, notebookId))
      return out
    })
    return inserted!
  })

  capture({
    distinctId: c.get("userId"),
    event: "ai_generation_completed",
    properties: {
      kind: "mindmap",
      notebook_id: notebookId,
      depth,
      has_prompt: !!body.prompt,
      tutor_preset: nb.tutorPreset ?? null,
      plan: c.get("userPlan"),
    },
  })

  return c.json(toMindmap(row))
})

router.post("/:id/mindmaps/translate", async (c) => {
  const notebookId = c.req.param("id")
  await requireOwnedNotebook(c.get("userId"), notebookId)
  const body = translateSchema.parse(await c.req.json())
  const target = normalizeLanguage(body.targetLanguage)

  const [existing] = await db
    .select()
    .from(mindmaps)
    .where(
      and(eq(mindmaps.notebookId, notebookId), eq(mindmaps.language, target))
    )
    .orderBy(desc(mindmaps.createdAt))
    .limit(1)
  if (existing) return c.json(toMindmap(existing))

  const [source] = await db
    .select()
    .from(mindmaps)
    .where(eq(mindmaps.notebookId, notebookId))
    .orderBy(desc(mindmaps.createdAt))
    .limit(1)
  if (!source) {
    return c.json(
      { error: "No mindmap to translate. Generate one first." },
      400
    )
  }

  const inserted = await withQuota(c, "mindmap.generate", async () => {
    const result = await translateMindmap({
      data: source.data as MindmapData,
      sourceLanguage: source.language,
      targetLanguage: target,
    })
    return await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(mindmaps)
        .values({
          id: nanoid(8),
          notebookId,
          title: source.title,
          prompt: source.prompt,
          data: result.data,
          language: target,
        })
        .returning()
      await tx
        .update(notebooks)
        .set({ updatedAt: sql`now()` })
        .where(eq(notebooks.id, notebookId))
      return row!
    })
  })

  capture({
    distinctId: c.get("userId"),
    event: "ai_translation_completed",
    properties: {
      kind: "mindmap",
      notebook_id: notebookId,
      source_language: source.language,
      target_language: target,
      plan: c.get("userPlan"),
    },
  })

  return c.json(toMindmap(inserted))
})

/* ------------------------------------------------------------------ */
/* /notebooks/:id/exam                                                 */
/* ------------------------------------------------------------------ */

router.get("/:id/exam", async (c) => {
  const id = c.req.param("id")
  await requireOwnedNotebook(c.get("userId"), id)
  const rows = await db
    .select()
    .from(exams)
    .where(eq(exams.notebookId, id))
    .orderBy(asc(exams.order), asc(exams.createdAt))
  return c.json(rows.map(toExam))
})

const examCreateSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  explanation: z.string().optional(),
  order: z.number().int().optional(),
})

router.post("/:id/exam", async (c) => {
  const id = c.req.param("id")
  await requireOwnedNotebook(c.get("userId"), id)
  const body = examCreateSchema.parse(await c.req.json())
  const [row] = await db
    .insert(exams)
    .values({
      id: nanoid(8),
      notebookId: id,
      question: body.question,
      answer: body.answer,
      explanation: body.explanation ?? null,
      order: body.order ?? 0,
    })
    .returning()
  return c.json(toExam(row!))
})

/* ------------------------------------------------------------------ */
/* /notebooks/:id/chat/sessions + /chat/stream                         */
/* ------------------------------------------------------------------ */

router.get("/:id/chat/sessions", async (c) => {
  const notebookId = c.req.param("id")
  const userId = c.get("userId")
  await requireOwnedNotebook(userId, notebookId)
  const rows = await db
    .select()
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.notebookId, notebookId),
        eq(chatSessions.userId, userId)
      )
    )
    .orderBy(desc(chatSessions.updatedAt))
  return c.json(rows.map(toChatSession))
})

const CHAT_MODEL_ID = "gpt-4o-mini"
const RAG_TOP_K = Number(process.env.RAG_TOP_K ?? "8")
// Hard ceiling on a single assistant reply — defends against prompts that
// elicit unbounded output (e.g. "write a 100-page essay") on the free tier.
const CHAT_MAX_OUTPUT_TOKENS = 1500

const chatStreamSchema = z.object({
  sessionId: z.string().min(1).nullable().optional(),
  userMessage: z.string().min(1),
  context: z.array(z.string()).optional(),
})

function presetSystem(preset: TutorPreset | null): string {
  const key: TutorPreset = preset ?? "default"
  return TUTOR_PRESETS[key].chatSystemPrompt
}

function formatRetrievedContext(hits: SearchHit[]): string {
  return hits
    .map(
      (h, i) => `[${i + 1}] (source: ${h.sourceTitle}, p.${h.page})\n${h.text}`
    )
    .join("\n\n")
}

const CHAT_DEBUG_DIR = path.resolve(process.cwd(), "debug/chat-context")
// User chat content (system prompts, retrieved RAG chunks, message history)
// must never hit the prod filesystem — the privacy policy says so. Set
// CHAT_DEBUG_DUMP=1 in dev to opt in.
const CHAT_DEBUG_ENABLED =
  process.env.NODE_ENV !== "production" && process.env.CHAT_DEBUG_DUMP === "1"

async function dumpChatContextToFile(payload: {
  notebookId: string
  notebookTitle: string
  sessionId: string | null
  model: string
  retrievalQuery: string
  hits: SearchHit[]
  systemParts: string[]
  modelMessages: Array<{ role: string; content: string }>
}) {
  if (!CHAT_DEBUG_ENABLED) return
  const now = new Date()
  const stamp = now.toISOString().replace(/[:.]/g, "-")
  const fname = `${stamp}_${payload.notebookId}_${payload.sessionId ?? "new"}.txt`
  const fpath = path.join(CHAT_DEBUG_DIR, fname)

  const sep = (label: string) =>
    `\n\n${"=".repeat(8)} ${label} ${"=".repeat(Math.max(0, 70 - label.length))}\n`

  const lines: string[] = []
  lines.push(`Chat context dump`)
  lines.push(`Timestamp: ${now.toISOString()}`)
  lines.push(`Notebook:  ${payload.notebookTitle} (${payload.notebookId})`)
  lines.push(`Session:   ${payload.sessionId ?? "(new)"}`)
  lines.push(`Model:     ${payload.model}`)
  lines.push(`Hits:      ${payload.hits.length}`)

  lines.push(sep("RETRIEVAL QUERY (used for embedding)"))
  lines.push(payload.retrievalQuery)

  lines.push(sep(`RETRIEVED CHUNKS (${payload.hits.length})`))
  if (payload.hits.length === 0) {
    lines.push("(no hits)")
  } else {
    payload.hits.forEach((h, i) => {
      lines.push(
        `[${i + 1}] score=${h.score.toFixed(4)} source=${h.sourceTitle} (id=${h.sourceId}) page=${h.page} chunkId=${h.id}`
      )
      lines.push(h.text)
      lines.push("")
    })
  }

  lines.push(sep("SYSTEM PROMPT (joined, exactly as sent)"))
  lines.push(payload.systemParts.join("\n\n"))

  lines.push(sep("SYSTEM PROMPT PARTS (broken out)"))
  payload.systemParts.forEach((part, i) => {
    lines.push(`--- part ${i + 1} ---`)
    lines.push(part)
    lines.push("")
  })

  lines.push(sep(`MESSAGES TO MODEL (${payload.modelMessages.length})`))
  payload.modelMessages.forEach((m, i) => {
    lines.push(`--- message ${i + 1} [${m.role}] ---`)
    lines.push(m.content)
    lines.push("")
  })

  try {
    await fs.mkdir(CHAT_DEBUG_DIR, { recursive: true })
    await fs.writeFile(fpath, lines.join("\n"), "utf8")
    console.log(`[chat/stream] dumped context to ${fpath}`)
  } catch (err) {
    console.error("[chat/stream] failed to dump context:", err)
  }
}

function dedupeCitations(hits: SearchHit[]): ChatCitation[] {
  const seen = new Set<string>()
  const out: ChatCitation[] = []
  for (const h of hits) {
    const key = `${h.sourceId}:${h.page}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ sourceId: h.sourceId, title: h.sourceTitle, page: h.page })
  }
  return out
}

router.post("/:id/chat/stream", async (c) => {
  const notebookId = c.req.param("id")
  const nb = await requireOwnedNotebook(c.get("userId"), notebookId)
  const body = chatStreamSchema.parse(await c.req.json())

  if (!process.env.OPENAI_API_KEY) {
    return c.json(
      { error: "AI is not configured on the server (OPENAI_API_KEY missing)." },
      503
    )
  }

  await checkQuota(c, "chat.message")
  const quotaUserId = c.get("userId")
  const quotaPlan = c.get("userPlan")

  const chips = (body.context ?? []).map((s) => s.trim()).filter(Boolean)
  const userMessageRaw = body.userMessage
  const userContentForModel = chips.length
    ? `${chips.map((s) => `> ${s}`).join("\n\n")}\n\n${userMessageRaw}`
    : userMessageRaw

  const retrievalQuery = chips.length
    ? `${chips.join("\n")}\n${userMessageRaw}`
    : userMessageRaw

  let hits: SearchHit[] = []
  try {
    const [queryEmbedding] = await embedTexts([retrievalQuery])
    if (queryEmbedding) {
      hits = await searchChunks(notebookId, queryEmbedding, RAG_TOP_K)
    }
  } catch (err) {
    console.error("[chat/stream] retrieval failed:", err)
  }

  const citations = dedupeCitations(hits)
  const contextBlock = hits.length
    ? `Retrieved passages from the notebook (use these as the authoritative context; cite them as [n] when you reference them):\n\n${formatRetrievedContext(hits)}`
    : "No relevant passages were retrieved from this notebook for the user's question. Be candid if you cannot answer from general knowledge."

  const systemParts = [
    loadPrompt("chat", { notebookTitle: nb.title }),
    presetSystem((nb.tutorPreset ?? null) as TutorPreset | null),
    contextBlock,
  ].filter(Boolean)

  let sessionId = body.sessionId ?? null
  const isNewSession = !sessionId
  let sessionSummary: string | null = null
  if (!sessionId) {
    sessionId = nanoid(10)
    await db.insert(chatSessions).values({
      id: sessionId,
      notebookId,
      userId: c.get("userId"),
      title: null,
    })
  } else {
    const [sess] = await db
      .select()
      .from(chatSessions)
      .where(
        and(
          eq(chatSessions.id, sessionId),
          eq(chatSessions.userId, c.get("userId"))
        )
      )
      .limit(1)
    if (!sess || sess.notebookId !== notebookId) {
      return c.json({ error: "Session not found for this notebook" }, 404)
    }
    sessionSummary = sess.summary ?? null
  }

  const history = isNewSession
    ? []
    : await db
        .select({
          role: chatMessages.role,
          content: chatMessages.content,
        })
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, sessionId))
        .orderBy(asc(chatMessages.createdAt))

  await db.insert(chatMessages).values({
    id: nanoid(10),
    sessionId,
    notebookId,
    role: "user",
    content: userMessageRaw,
  })

  const persistedSessionId = sessionId
  const userMessageForTitle = userMessageRaw

  const allMessages = [
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userContentForModel },
  ]
  const modelMessages = buildModelMessages({
    allMessages,
    summary: sessionSummary,
  })

  void dumpChatContextToFile({
    notebookId,
    notebookTitle: nb.title,
    sessionId: persistedSessionId,
    model: CHAT_MODEL_ID,
    retrievalQuery,
    hits,
    systemParts: systemParts as string[],
    modelMessages,
  })

  const result = streamText({
    model: openai(CHAT_MODEL_ID),
    system: systemParts.join("\n\n"),
    messages: modelMessages,
    maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS,
    // Forward client disconnect to the upstream OpenAI call so we stop
    // paying for tokens the user will never see.
    abortSignal: c.req.raw.signal,
    onFinish: async ({ text }) => {
      try {
        await db.insert(chatMessages).values({
          id: nanoid(10),
          sessionId: persistedSessionId,
          notebookId,
          role: "assistant",
          content: text,
          citations: citations.length > 0 ? citations : null,
        })
        await db
          .update(chatSessions)
          .set({ updatedAt: sql`now()` })
          .where(eq(chatSessions.id, persistedSessionId))

        await recordQuotaUsage(quotaUserId, quotaPlan, "chat.message")

        if (isNewSession) {
          const title = await generateChatTitle({
            userMessage: userMessageForTitle,
            assistantMessage: text,
          })
          await db
            .update(chatSessions)
            .set({ title })
            .where(eq(chatSessions.id, persistedSessionId))
        }

        void compactSessionIfNeeded(persistedSessionId)

        capture({
          distinctId: quotaUserId,
          event: "chat_message_streamed",
          properties: {
            notebook_id: notebookId,
            session_id: persistedSessionId,
            is_new_session: isNewSession,
            model: CHAT_MODEL_ID,
            response_length: text.length,
            retrieval_hits: hits.length,
            citations: citations.length,
            tutor_preset: nb.tutorPreset ?? null,
            plan: quotaPlan,
          },
        })
      } catch (err) {
        console.error("[chat/stream] onFinish persistence failed:", err)
        captureException(err, quotaUserId)
      }
    },
  })

  const response = result.toTextStreamResponse()
  response.headers.set("X-Session-Id", persistedSessionId)
  return response
})

export default router
