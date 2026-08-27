import { Hono } from "hono"
import { eq, sql } from "drizzle-orm"

import { db } from "@workspace/db"
import { onboardingAnswers } from "@workspace/db/schema"

import type { AppEnv } from "../types"

const router = new Hono<AppEnv>()

router.get("/", async (c) => {
  const userId = c.get("userId")
  const [row] = await db
    .select()
    .from(onboardingAnswers)
    .where(eq(onboardingAnswers.userId, userId))
    .limit(1)

  if (!row) {
    return c.json({ answers: null, completed: false })
  }

  return c.json({
    answers: row.answers as Record<string, unknown>,
    completed: true,
  })
})

router.post("/", async (c) => {
  const userId = c.get("userId")
  const body = (await c.req.json()) as Record<string, unknown>

  const [existing] = await db
    .select()
    .from(onboardingAnswers)
    .where(eq(onboardingAnswers.userId, userId))
    .limit(1)

  if (existing) {
    const [updated] = await db
      .update(onboardingAnswers)
      .set({
        answers: body,
        updatedAt: sql`now()`,
      })
      .where(eq(onboardingAnswers.userId, userId))
      .returning()

    return c.json({
      answers: updated?.answers as Record<string, unknown>,
      completed: true,
    })
  }

  const [inserted] = await db
    .insert(onboardingAnswers)
    .values({
      userId,
      answers: body,
    })
    .returning()

  return c.json(
    {
      answers: inserted?.answers as Record<string, unknown>,
      completed: true,
    },
    201,
  )
})

export default router
