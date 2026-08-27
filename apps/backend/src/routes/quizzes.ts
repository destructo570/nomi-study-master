import { Hono } from "hono"
import { and, eq, inArray } from "drizzle-orm"
import { z } from "zod"

import { db } from "@workspace/db"
import { quizzes } from "@workspace/db/schema"
import { toQuiz } from "@workspace/db/serialize"

import { ownedNotebookIds, requireOwnedQuiz } from "../lib/ownership"
import type { AppEnv } from "../types"

const router = new Hono<AppEnv>()

const patchSchema = z
  .object({
    question: z.string().min(1).optional(),
    options: z.array(z.string().min(1)).min(2).optional(),
    correctAnswer: z.string().min(1).optional(),
  })
  .refine(
    (v) =>
      v.question !== undefined ||
      v.options !== undefined ||
      v.correctAnswer !== undefined,
    { message: "empty patch" },
  )

router.patch("/:id", async (c) => {
  const id = c.req.param("id")
  const userId = c.get("userId")
  await requireOwnedQuiz(userId, id)
  const body = patchSchema.parse(await c.req.json())
  if (body.options && body.correctAnswer && !body.options.includes(body.correctAnswer)) {
    return c.json({ error: "correctAnswer must be one of options" }, 400)
  }
  const [row] = await db
    .update(quizzes)
    .set({
      ...(body.question !== undefined ? { question: body.question } : {}),
      ...(body.options !== undefined ? { options: body.options } : {}),
      ...(body.correctAnswer !== undefined
        ? { correctAnswer: body.correctAnswer }
        : {}),
    })
    .where(
      and(
        eq(quizzes.id, id),
        inArray(quizzes.notebookId, ownedNotebookIds(userId)),
      ),
    )
    .returning()
  if (!row) return c.json(null, 404)
  return c.json(toQuiz(row))
})

router.delete("/:id", async (c) => {
  const id = c.req.param("id")
  const userId = c.get("userId")
  await requireOwnedQuiz(userId, id)
  await db
    .delete(quizzes)
    .where(
      and(
        eq(quizzes.id, id),
        inArray(quizzes.notebookId, ownedNotebookIds(userId)),
      ),
    )
  return c.json({ ok: true })
})

export default router
