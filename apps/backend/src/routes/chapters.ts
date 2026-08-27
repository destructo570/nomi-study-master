import { Hono } from "hono"
import { and, eq, inArray, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "@workspace/db"
import { chapters, notebooks } from "@workspace/db/schema"
import { toChapter } from "@workspace/db/serialize"

import { ownedNotebookIds, requireOwnedChapter } from "../lib/ownership"
import type { AppEnv } from "../types"

const router = new Hono<AppEnv>()

router.get("/:id", async (c) => {
  const id = c.req.param("id")
  const row = await requireOwnedChapter(c.get("userId"), id)
  return c.json(toChapter(row))
})

const patchSchema = z.object({
  title: z.string().optional(),
  markdown: z.string().optional(),
})

router.patch("/:id", async (c) => {
  const id = c.req.param("id")
  const userId = c.get("userId")
  await requireOwnedChapter(userId, id)
  const body = patchSchema.parse(await c.req.json())
  const set: Record<string, unknown> = { updatedAt: sql`now()` }
  if (typeof body.title === "string") set.title = body.title
  if (typeof body.markdown === "string") set.markdown = body.markdown
  const [row] = await db
    .update(chapters)
    .set(set)
    .where(
      and(
        eq(chapters.id, id),
        inArray(chapters.notebookId, ownedNotebookIds(userId)),
      ),
    )
    .returning()
  if (row) {
    await db
      .update(notebooks)
      .set({ updatedAt: sql`now()` })
      .where(and(eq(notebooks.id, row.notebookId), eq(notebooks.userId, userId)))
  }
  return c.json(row ? toChapter(row) : null)
})

router.delete("/:id", async (c) => {
  const id = c.req.param("id")
  const userId = c.get("userId")
  await requireOwnedChapter(userId, id)
  await db
    .delete(chapters)
    .where(
      and(
        eq(chapters.id, id),
        inArray(chapters.notebookId, ownedNotebookIds(userId)),
      ),
    )
  return c.json({ ok: true })
})

export default router
