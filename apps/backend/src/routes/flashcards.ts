import { Hono } from "hono"
import { and, eq, inArray } from "drizzle-orm"
import { z } from "zod"

import { db } from "@workspace/db"
import { flashcards } from "@workspace/db/schema"
import { toFlashcard } from "@workspace/db/serialize"

import { ownedNotebookIds, requireOwnedFlashcard } from "../lib/ownership"
import type { AppEnv } from "../types"

const router = new Hono<AppEnv>()

const patchSchema = z.object({
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  hint: z.string().nullable().optional(),
})

router.patch("/:id", async (c) => {
  const id = c.req.param("id")
  const userId = c.get("userId")
  await requireOwnedFlashcard(userId, id)
  const body = patchSchema.parse(await c.req.json())
  if (
    body.question === undefined &&
    body.answer === undefined &&
    body.hint === undefined
  ) {
    return c.json({ error: "empty patch" }, 400)
  }
  const [row] = await db
    .update(flashcards)
    .set({
      ...(body.question !== undefined ? { question: body.question } : {}),
      ...(body.answer !== undefined ? { answer: body.answer } : {}),
      ...(body.hint !== undefined ? { hint: body.hint } : {}),
    })
    .where(
      and(
        eq(flashcards.id, id),
        inArray(flashcards.notebookId, ownedNotebookIds(userId)),
      ),
    )
    .returning()
  if (!row) return c.json(null, 404)
  return c.json(toFlashcard(row))
})

router.delete("/:id", async (c) => {
  const id = c.req.param("id")
  const userId = c.get("userId")
  await requireOwnedFlashcard(userId, id)
  await db
    .delete(flashcards)
    .where(
      and(
        eq(flashcards.id, id),
        inArray(flashcards.notebookId, ownedNotebookIds(userId)),
      ),
    )
  return c.json({ ok: true })
})

export default router
