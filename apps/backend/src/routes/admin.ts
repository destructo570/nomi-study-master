import { Hono } from "hono"
import { and, desc, eq } from "drizzle-orm"
import { z } from "zod"

import { db } from "@workspace/db"
import { creditPromoSubmissions, feedback, users } from "@workspace/db/schema"

import type { AppEnv } from "../types"
import { grantCredits, getCreditState, revokeCredits } from "../lib/quota"

const router = new Hono<AppEnv>()

const grantSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().positive().max(10_000),
  reason: z.string().min(1).max(200),
  source: z.string().min(1).max(50).default("admin"),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

const downgradeSchema = z.object({
  reason: z.string().min(1).max(200).default("admin_manual_downgrade"),
})

/**
 * Force-downgrade a Pro user to free and wipe their credit balance.
 * Escape hatch for cases where the Dodo webhook didn't fire or arrived
 * misconfigured — the refund/expiry path should normally be automatic.
 */
router.post("/users/:id/downgrade", async (c) => {
  const actorUserId = c.get("userId")
  const targetId = c.req.param("id")
  const body = downgradeSchema.parse(
    (await c.req.json().catch(() => ({}))) ?? {},
  )

  const [target] = await db
    .select({ id: users.id, plan: users.plan })
    .from(users)
    .where(eq(users.id, targetId))
    .limit(1)
  if (!target) return c.json({ error: "user_not_found" }, 404)

  await db
    .update(users)
    .set({
      plan: "free",
      subscriptionStatus: "cancelled",
      subscriptionCurrentPeriodEnd: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, targetId))

  await revokeCredits({
    userId: targetId,
    reason: body.reason,
    source: "admin",
    metadata: { actorUserId, priorPlan: target.plan },
  })

  return c.json({
    ok: true,
    credits: await getCreditState(targetId),
  })
})

router.post("/credits/grant", async (c) => {
  const actorUserId = c.get("userId")
  const body = grantSchema.parse(await c.req.json())
  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, body.userId))
    .limit(1)
  if (!target) return c.json({ error: "user_not_found" }, 404)
  const state = await grantCredits({
    userId: body.userId,
    amount: body.amount,
    reason: body.reason,
    source: body.source,
    actorUserId,
    metadata: body.metadata ?? null,
  })
  return c.json({ ok: true, credits: state })
})

router.get("/credits/promo-submissions", async (c) => {
  const status = c.req.query("status")
  const where = status
    ? eq(creditPromoSubmissions.status, status)
    : undefined
  const rows = await db
    .select({
      submission: creditPromoSubmissions,
      userEmail: users.email,
      userName: users.name,
    })
    .from(creditPromoSubmissions)
    .leftJoin(users, eq(users.id, creditPromoSubmissions.userId))
    .where(where)
    .orderBy(desc(creditPromoSubmissions.submittedAt))
    .limit(200)
  return c.json(rows)
})

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  creditsAwarded: z.number().int().min(0).max(10_000).default(0),
  viewsAtApproval: z.number().int().min(0).optional(),
  notes: z.string().max(2000).optional(),
})

router.post("/credits/promo-submissions/:id/review", async (c) => {
  const reviewerId = c.get("userId")
  const id = c.req.param("id")
  const body = reviewSchema.parse(await c.req.json())

  const [submission] = await db
    .select()
    .from(creditPromoSubmissions)
    .where(
      and(
        eq(creditPromoSubmissions.id, id),
        eq(creditPromoSubmissions.status, "pending"),
      ),
    )
    .limit(1)
  if (!submission) {
    return c.json({ error: "submission_not_pending" }, 404)
  }

  const [updated] = await db
    .update(creditPromoSubmissions)
    .set({
      status: body.status,
      creditsAwarded: body.status === "approved" ? body.creditsAwarded : 0,
      viewsAtApproval: body.viewsAtApproval ?? null,
      notes: body.notes ?? null,
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
    })
    .where(eq(creditPromoSubmissions.id, id))
    .returning()

  if (body.status === "approved" && body.creditsAwarded > 0) {
    await grantCredits({
      userId: submission.userId,
      amount: body.creditsAwarded,
      reason: `promo:${submission.platform}`,
      source: "promo",
      actorUserId: reviewerId,
      metadata: {
        submissionId: submission.id,
        postUrl: submission.postUrl,
        viewsAtApproval: body.viewsAtApproval ?? null,
      },
    })
  }

  return c.json({
    ok: true,
    submission: updated,
    credits:
      body.status === "approved"
        ? await getCreditState(submission.userId)
        : null,
  })
})

router.get("/feedback", async (c) => {
  const rows = await db
    .select({
      feedback,
      userEmail: users.email,
      userName: users.name,
    })
    .from(feedback)
    .leftJoin(users, eq(users.id, feedback.userId))
    .orderBy(desc(feedback.createdAt))
    .limit(200)
  return c.json(rows)
})

export default router
