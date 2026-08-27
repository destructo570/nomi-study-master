import { Hono } from "hono"
import { eq, desc, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "@workspace/db"
import { creditPromoSubmissions, users } from "@workspace/db/schema"
import { toMe } from "@workspace/db/serialize"
import type { Plan } from "@workspace/types"
import { isLanguageCode } from "@workspace/types/language"

import type { AppEnv } from "../types"
import { normalizeStatus, nextPlanForStatus } from "../lib/plan-check"
import { getCreditState, listActionCosts } from "../lib/quota"

const router = new Hono<AppEnv>()

router.get("/", async (c) => {
  const userId = c.get("userId")
  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!row) return c.json({ error: "user not found" }, 404)
  const effectivePlan = nextPlanForStatus(
    normalizeStatus(row.subscriptionStatus),
    row.subscriptionCurrentPeriodEnd,
    new Date(),
  )
  const me = toMe(row)
  me.plan = effectivePlan
  return c.json(me)
})

const updateMeSchema = z.object({
  language: z
    .string()
    .min(2)
    .max(8)
    .refine(isLanguageCode, { message: "Unsupported language code" })
    .optional(),
})

router.patch("/", async (c) => {
  const userId = c.get("userId")
  const body = updateMeSchema.parse(await c.req.json())
  const patch: Record<string, unknown> = {}
  if (body.language !== undefined) patch.language = body.language
  if (Object.keys(patch).length === 0) {
    return c.json({ error: "no fields to update" }, 400)
  }
  patch.updatedAt = sql`now()`
  const [row] = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, userId))
    .returning()
  if (!row) return c.json({ error: "user not found" }, 404)
  return c.json(toMe(row))
})

router.get("/usage", async (c) => {
  const userId = c.get("userId")
  const plan = c.get("userPlan") as Plan
  const credits = plan === "pro" ? null : await getCreditState(userId)
  return c.json({
    plan,
    credits,
    actionCosts: listActionCosts(),
  })
})

const promoSchema = z.object({
  postUrl: z.string().url().max(500),
  platform: z.enum(["tiktok", "instagram"]).default("tiktok"),
})

router.post("/credits/promo-submissions", async (c) => {
  const userId = c.get("userId")
  const body = promoSchema.parse(await c.req.json())
  const id = `cps_${crypto.randomUUID()}`
  const [row] = await db
    .insert(creditPromoSubmissions)
    .values({
      id,
      userId,
      postUrl: body.postUrl,
      platform: body.platform,
      status: "pending",
    })
    .returning()
  return c.json(row, 201)
})

router.get("/credits/promo-submissions", async (c) => {
  const userId = c.get("userId")
  const rows = await db
    .select()
    .from(creditPromoSubmissions)
    .where(eq(creditPromoSubmissions.userId, userId))
    .orderBy(desc(creditPromoSubmissions.submittedAt))
    .limit(50)
  return c.json(rows)
})

export default router
