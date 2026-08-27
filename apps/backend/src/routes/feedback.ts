import { Hono } from "hono"
import { z } from "zod"

import { db } from "@workspace/db"
import { feedback } from "@workspace/db/schema"

import type { AppEnv } from "../types"

const router = new Hono<AppEnv>()

const feedbackSchema = z.object({
  message: z.string().trim().min(1).max(5000),
})

router.post("/", async (c) => {
  const userId = c.get("userId") ?? null
  const body = feedbackSchema.parse(await c.req.json())
  const id = `fb_${crypto.randomUUID()}`
  const userAgent = c.req.header("user-agent") ?? null
  const [row] = await db
    .insert(feedback)
    .values({
      id,
      userId,
      message: body.message,
      userAgent,
    })
    .returning()
  return c.json(row, 201)
})

export default router
