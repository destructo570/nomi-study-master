import { Hono } from "hono"
import { eq } from "drizzle-orm"
import { Webhook } from "standardwebhooks"

import { db } from "@workspace/db"
import { users } from "@workspace/db/schema"
import type { SubscriptionStatus, SubscriptionTier } from "@workspace/types"
import { isSubscriptionTier } from "@workspace/types/plan"

import {
  DODO_WEBHOOK_KEY,
  dodo,
  productIdForTier,
  tierForProductId,
} from "../lib/dodo"
import { normalizeStatus, nextPlanForStatus } from "../lib/plan-check"
import { capture, captureException } from "../lib/posthog"
import { revokeCredits } from "../lib/quota"
import type { AppEnv } from "../types"

const router = new Hono<AppEnv>()

router.get("/subscription", async (c) => {
  const userId = c.get("userId")
  const [row] = await db
    .select({
      tier: users.subscriptionTier,
      status: users.subscriptionStatus,
      currentPeriodEnd: users.subscriptionCurrentPeriodEnd,
      dodoSubscriptionId: users.dodoSubscriptionId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!row) return c.json({ error: "user not found" }, 404)
  return c.json({
    tier: row.tier as SubscriptionTier | null,
    status: row.status as SubscriptionStatus | null,
    currentPeriodEnd: row.currentPeriodEnd
      ? row.currentPeriodEnd.toISOString()
      : null,
    subscriptionId: row.dodoSubscriptionId,
  })
})

router.post("/checkout", async (c) => {
  const userId = c.get("userId")
  const body = (await c.req.json().catch(() => null)) as
    | { tier?: unknown }
    | null
  const tier = body?.tier
  if (!isSubscriptionTier(tier)) {
    return c.json({ error: "invalid tier" }, 400)
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      dodoCustomerId: users.dodoCustomerId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!user) return c.json({ error: "user not found" }, 404)

  const productId = productIdForTier(tier)
  const webOrigin = process.env.WEB_ORIGIN ?? ""
  const customer = user.dodoCustomerId
    ? { customer_id: user.dodoCustomerId }
    : { email: user.email, name: user.name ?? user.email }

  const session = await dodo.checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer,
    metadata: { user_id: user.id, tier },
    return_url: `${webOrigin}/billing/success?tier=${tier}`,
    cancel_url: `${webOrigin}/billing/cancel`,
  })

  if (!session.checkout_url) {
    return c.json({ error: "checkout url unavailable" }, 502)
  }
  return c.json({ checkoutUrl: session.checkout_url, sessionId: session.session_id })
})

router.post("/cancel", async (c) => {
  const userId = c.get("userId")
  const body = (await c.req.json().catch(() => null)) as
    | { feedback?: string; comment?: string }
    | null

  const [user] = await db
    .select({
      dodoSubscriptionId: users.dodoSubscriptionId,
      plan: users.plan,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!user) return c.json({ error: "user not found" }, 404)
  if (!user.dodoSubscriptionId) {
    return c.json({ error: "no active subscription" }, 400)
  }
  if (user.plan !== "pro") {
    return c.json({ error: "no pro plan to cancel" }, 400)
  }

  try {
    await dodo.subscriptions.update(user.dodoSubscriptionId, {
      status: "cancelled",
      cancel_reason: "cancelled_by_customer",
      ...(body?.feedback
        ? { cancellation_feedback: body.feedback as "too_expensive" | "missing_features" | "switched_service" | "unused" | "customer_service" | "low_quality" | "too_complex" | "other" }
        : {}),
      ...(body?.comment ? { cancellation_comment: body.comment } : {}),
    })
  } catch (err) {
    console.error(
      "[billing] cancel failed:",
      err instanceof Error ? err.message : err,
    )
    captureException(err)
    return c.json({ error: "failed to cancel subscription" }, 502)
  }

  await db
    .update(users)
    .set({
      subscriptionStatus: "cancelled",
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  capture({
    distinctId: userId,
    event: "subscription_cancelled",
    properties: {
      feedback: body?.feedback ?? null,
    },
  })

  return c.json({ ok: true })
})

/**
 * Dodo webhook receiver. Mounted as a public route (see middleware/auth.ts).
 * Uses Standard Webhooks for signature verification — must read the raw body
 * before parsing.
 */
router.post("/webhook", async (c) => {
  if (!DODO_WEBHOOK_KEY) {
    console.warn("[dodo-webhook] DODO_WEBHOOK_KEY is not set; rejecting")
    return c.json({ error: "webhook not configured" }, 503)
  }

  const rawBody = await c.req.text()
  const headers = c.req.raw.headers
  const wh = new Webhook(DODO_WEBHOOK_KEY)
  let payload: unknown
  try {
    payload = wh.verify(rawBody, {
      "webhook-id": headers.get("webhook-id") ?? "",
      "webhook-signature": headers.get("webhook-signature") ?? "",
      "webhook-timestamp": headers.get("webhook-timestamp") ?? "",
    })
  } catch (err) {
    console.warn(
      "[dodo-webhook] signature verification failed:",
      err instanceof Error ? err.message : err,
    )
    captureException(err)
    return c.json({ error: "invalid signature" }, 401)
  }

  const event = payload as {
    type?: string
    data?: {
      payload_type?: string
      subscription_id?: string
      product_id?: string
      status?: string
      next_billing_date?: string
      metadata?: Record<string, string>
      customer?: { customer_id?: string }
    }
  }

  const type = event.type ?? ""
  const data = event.data ?? {}

  // Two event families matter:
  //   - subscription.* : lifecycle (active / cancelled / expired / failed)
  //   - payment.refunded (or payload_type "Refund") : merchant-issued refund,
  //     which forces an immediate downgrade regardless of subscription status
  const isSubscriptionEvent = type.startsWith("subscription.")
  const isRefundEvent =
    type === "payment.refunded" || data.payload_type === "Refund"

  if (!isSubscriptionEvent && !isRefundEvent) {
    return c.json({ ok: true, ignored: type })
  }

  const subscriptionId = data.subscription_id ?? null
  const customerId = data.customer?.customer_id ?? null
  const metaUserId = data.metadata?.user_id ?? null

  let userId: string | null = null
  if (subscriptionId) {
    const [bySubscription] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.dodoSubscriptionId, subscriptionId))
      .limit(1)
    userId = bySubscription?.id ?? null
  }
  if (!userId && customerId) {
    const [byCustomer] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.dodoCustomerId, customerId))
      .limit(1)
    userId = byCustomer?.id ?? null
  }
  if (!userId && metaUserId) {
    const [byMeta] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, metaUserId))
      .limit(1)
    userId = byMeta?.id ?? null
  }

  if (!userId) {
    console.warn(
      "[dodo-webhook] could not resolve user for",
      type,
      { subscriptionId, customerId, metaUserId },
    )
    return c.json({ ok: true })
  }

  if (isRefundEvent) {
    await db
      .update(users)
      .set({
        plan: "free",
        subscriptionStatus: "cancelled",
        subscriptionCurrentPeriodEnd: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
    await revokeCredits({
      userId,
      reason: "subscription_refunded",
      source: "webhook:dodo",
    })
    capture({
      distinctId: userId,
      event: "subscription_ended",
      properties: {
        reason: "refunded",
        webhook_type: type,
      },
    })
    return c.json({ ok: true })
  }

  // Subscription lifecycle event past this point.
  if (!subscriptionId) {
    console.warn("[dodo-webhook] missing subscription_id on", type)
    return c.json({ ok: true })
  }

  const [priorRow] = await db
    .select({ plan: users.plan })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  const priorPlan = priorRow?.plan ?? "free"

  const status = normalizeStatus(data.status)
  const tier = tierForProductId(data.product_id)
  const periodEnd = data.next_billing_date
    ? new Date(data.next_billing_date)
    : null
  const plan = nextPlanForStatus(status, periodEnd, new Date())

  await db
    .update(users)
    .set({
      plan,
      dodoSubscriptionId: subscriptionId,
      ...(customerId ? { dodoCustomerId: customerId } : {}),
      ...(tier ? { subscriptionTier: tier } : {}),
      ...(status ? { subscriptionStatus: status } : {}),
      ...(periodEnd && !Number.isNaN(periodEnd.getTime())
        ? { subscriptionCurrentPeriodEnd: periodEnd }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  // Pro → free transition: subscription ended (expired, period-passed
  // cancellation, or a hard fail). Wipe the credit pool — per policy,
  // downgraded users get zero credits, not the free-tier starter grant.
  if (priorPlan === "pro" && plan === "free") {
    await revokeCredits({
      userId,
      reason: `subscription_${status ?? "ended"}`,
      source: "webhook:dodo",
    })
    capture({
      distinctId: userId,
      event: "subscription_ended",
      properties: {
        reason: status ?? "ended",
        tier: tier ?? null,
        webhook_type: type,
      },
    })
  } else if (priorPlan !== "pro" && plan === "pro") {
    capture({
      distinctId: userId,
      event: "subscription_activated",
      properties: {
        tier: tier ?? null,
        status: status ?? null,
        period_end: periodEnd?.toISOString() ?? null,
        webhook_type: type,
      },
    })
  }

  return c.json({ ok: true })
})

export default router
