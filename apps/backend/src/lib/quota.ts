import type { Context } from "hono"
import { HTTPException } from "hono/http-exception"
import { eq, sql } from "drizzle-orm"

import { db } from "@workspace/db"
import { creditGrants, userCredits } from "@workspace/db/schema"
import {
  type ActionKey,
  ACTION_LABELS,
  CREDIT_COSTS,
  FREE_STARTER_CREDITS,
  type CreditState,
  creditCost,
} from "@workspace/types/quotas"
import type { Plan } from "@workspace/types"

import type { AppEnv } from "../types"
import { enforceOpenAIRateLimitForUser } from "./rate-limit"

/**
 * Free users now share a single credit pool instead of per-action quotas.
 * Pro users pass through every check (unlimited).
 *
 * The class is still named QuotaExceededError so the error-handler import
 * (`middleware/error.ts`) and the front-end 429 path keep working without
 * churn. The 429 body shape is also preserved (`error: "quota_exceeded"`,
 * `action`, `used`, `limit`, `period`).
 */
export class QuotaExceededError extends HTTPException {
  action: ActionKey
  used: number
  limit: number

  constructor(action: ActionKey, used: number, limit: number) {
    super(429, {
      message: `Out of credits for ${ACTION_LABELS[action]}: ${used}/${limit} used.`,
    })
    this.action = action
    this.used = used
    this.limit = limit
  }

  toResponse(): Response {
    return new Response(
      JSON.stringify({
        error: "quota_exceeded",
        action: this.action,
        used: this.used,
        limit: this.limit,
        period: "lifetime",
      }),
      {
        status: 429,
        headers: { "content-type": "application/json" },
      },
    )
  }
}

export type PlanLimitKind = "notebooks" | "podcast_pro_only"

export class PlanLimitError extends HTTPException {
  limitKind: PlanLimitKind
  current: number
  limit: number
  plan: Plan

  constructor(opts: {
    limitKind: PlanLimitKind
    current: number
    limit: number
    plan: Plan
    message?: string
  }) {
    super(403, {
      message:
        opts.message ??
        `Plan limit reached for ${opts.limitKind}: ${opts.current}/${opts.limit} on the ${opts.plan} plan.`,
    })
    this.limitKind = opts.limitKind
    this.current = opts.current
    this.limit = opts.limit
    this.plan = opts.plan
  }

  toResponse(): Response {
    return new Response(
      JSON.stringify({
        error: "plan_limit_exceeded",
        limitKind: this.limitKind,
        current: this.current,
        limit: this.limit,
        plan: this.plan,
      }),
      {
        status: 403,
        headers: { "content-type": "application/json" },
      },
    )
  }
}

/**
 * Block free users from a Pro-only feature. Throws a PlanLimitError that the
 * frontend turns into an upgrade-to-pro modal.
 */
export function requireProForPodcast(plan: Plan): void {
  if (plan === "pro") return
  throw new PlanLimitError({
    limitKind: "podcast_pro_only",
    current: 0,
    limit: 0,
    plan,
    message: "Podcasts are a Pro feature. Upgrade to generate podcasts from your notebooks.",
  })
}

/* ------------------------------------------------------------------ */
/* Credit-pool primitives                                              */
/* ------------------------------------------------------------------ */

function newGrantId(): string {
  return `cg_${crypto.randomUUID()}`
}

/**
 * Read a user's current credit state. First-time callers get the starter
 * grant lazily — that way new sign-ups don't need a Better Auth hook.
 */
export async function getCreditState(userId: string): Promise<CreditState> {
  const [row] = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userId))
    .limit(1)
  if (row) {
    return {
      balance: row.balance,
      lifetimeGranted: row.lifetimeGranted,
      lifetimeConsumed: row.lifetimeConsumed,
      starterAmount: FREE_STARTER_CREDITS,
    }
  }
  // Lazy starter grant. Race-safe via INSERT ... ON CONFLICT DO NOTHING.
  await db
    .insert(userCredits)
    .values({
      userId,
      balance: FREE_STARTER_CREDITS,
      lifetimeGranted: FREE_STARTER_CREDITS,
      lifetimeConsumed: 0,
    })
    .onConflictDoNothing({ target: userCredits.userId })
  await db.insert(creditGrants).values({
    id: newGrantId(),
    userId,
    delta: FREE_STARTER_CREDITS,
    reason: "signup_starter",
    source: "system",
  })
  return {
    balance: FREE_STARTER_CREDITS,
    lifetimeGranted: FREE_STARTER_CREDITS,
    lifetimeConsumed: 0,
    starterAmount: FREE_STARTER_CREDITS,
  }
}

/**
 * Atomically deduct `cost` from a user's balance. Returns the new balance.
 * Throws QuotaExceededError if balance is insufficient.
 */
async function consumeCredits(
  userId: string,
  action: ActionKey,
  cost: number,
): Promise<number> {
  // Ensure row exists first so the UPDATE can match.
  await getCreditState(userId)
  const result = await db
    .update(userCredits)
    .set({
      balance: sql`${userCredits.balance} - ${cost}`,
      lifetimeConsumed: sql`${userCredits.lifetimeConsumed} + ${cost}`,
      updatedAt: sql`now()`,
    })
    .where(
      sql`${userCredits.userId} = ${userId} AND ${userCredits.balance} >= ${cost}`,
    )
    .returning({ balance: userCredits.balance })
  const updated = result[0]
  if (!updated) {
    const state = await getCreditState(userId)
    throw new QuotaExceededError(action, state.lifetimeConsumed, state.lifetimeGranted)
  }
  await db.insert(creditGrants).values({
    id: newGrantId(),
    userId,
    delta: -cost,
    reason: `consume:${action}`,
    source: "consume",
  })
  return updated.balance
}

/**
 * Run an AI action with credit enforcement.
 *
 * - Pro users pass through (no DB writes).
 * - Free users: pre-check balance, run `fn`, then atomically deduct on success.
 *   If `fn` throws, no credits are deducted.
 */
export async function withQuota<T>(
  c: Context<AppEnv>,
  action: ActionKey,
  fn: () => Promise<T>,
  weight = 1,
): Promise<T> {
  const userId = c.get("userId")
  const plan = c.get("userPlan") as Plan
  await enforceOpenAIRateLimitForUser(userId, plan)
  if (plan === "pro") return fn()

  const cost = creditCost(action) * weight
  const state = await getCreditState(userId)
  if (state.balance < cost) {
    throw new QuotaExceededError(action, state.lifetimeConsumed, state.lifetimeGranted)
  }
  const result = await fn()
  await consumeCredits(userId, action, cost)
  return result
}

/**
 * Check credits without deducting. Use for streaming endpoints — pair with
 * `recordQuotaUsage` after the stream completes successfully.
 */
export async function checkQuota(
  c: Context<AppEnv>,
  action: ActionKey,
): Promise<void> {
  const userId = c.get("userId")
  const plan = c.get("userPlan") as Plan
  await checkQuotaForUser(userId, plan, action)
}

/**
 * Worker-safe check (no Hono context). Throws if the free user lacks credits.
 */
export async function checkQuotaForUser(
  userId: string,
  plan: Plan,
  action: ActionKey,
): Promise<void> {
  await enforceOpenAIRateLimitForUser(userId, plan)
  if (plan === "pro") return
  const cost = creditCost(action)
  const state = await getCreditState(userId)
  if (state.balance < cost) {
    throw new QuotaExceededError(action, state.lifetimeConsumed, state.lifetimeGranted)
  }
}

/**
 * Record a successful action (deduct credits). No-op for pro users.
 * Pair with `checkQuota` for streaming / async paths.
 */
export async function recordQuotaUsage(
  userId: string,
  plan: Plan,
  action: ActionKey,
  weight = 1,
): Promise<void> {
  if (plan === "pro") return
  const cost = creditCost(action) * weight
  await consumeCredits(userId, action, cost)
}

/**
 * Award credits to a user. Append-only ledger entry + balance bump.
 * Used by admin grants and approved promo submissions.
 */
export async function grantCredits(input: {
  userId: string
  amount: number
  reason: string
  source: string
  actorUserId?: string | null
  metadata?: Record<string, unknown> | null
}): Promise<CreditState> {
  if (input.amount <= 0) throw new Error("amount must be positive")
  // Make sure the row exists.
  await getCreditState(input.userId)
  const [updated] = await db
    .update(userCredits)
    .set({
      balance: sql`${userCredits.balance} + ${input.amount}`,
      lifetimeGranted: sql`${userCredits.lifetimeGranted} + ${input.amount}`,
      updatedAt: sql`now()`,
    })
    .where(eq(userCredits.userId, input.userId))
    .returning()
  await db.insert(creditGrants).values({
    id: newGrantId(),
    userId: input.userId,
    delta: input.amount,
    reason: input.reason,
    source: input.source,
    metadata: input.metadata ?? null,
    actorUserId: input.actorUserId ?? null,
  })
  if (!updated) throw new Error("credit row missing after upsert")
  return {
    balance: updated.balance,
    lifetimeGranted: updated.lifetimeGranted,
    lifetimeConsumed: updated.lifetimeConsumed,
    starterAmount: FREE_STARTER_CREDITS,
  }
}

/**
 * Wipe a user's credit balance to zero. Used when a Pro subscription ends
 * (expired/refunded) — the user keeps their notebooks but loses any pooled
 * credits, including the original signup grant. Bumps `lifetimeConsumed` so
 * the quota error message reads "X/X used" instead of a misleading "0/X".
 */
export async function revokeCredits(input: {
  userId: string
  reason: string
  source: string
  metadata?: Record<string, unknown> | null
}): Promise<void> {
  const state = await getCreditState(input.userId)
  if (state.balance <= 0) return
  const current = state.balance
  await db
    .update(userCredits)
    .set({
      balance: 0,
      lifetimeConsumed: sql`${userCredits.lifetimeConsumed} + ${current}`,
      updatedAt: sql`now()`,
    })
    .where(eq(userCredits.userId, input.userId))
  await db.insert(creditGrants).values({
    id: newGrantId(),
    userId: input.userId,
    delta: -current,
    reason: input.reason,
    source: input.source,
    metadata: input.metadata ?? null,
  })
}

/**
 * Per-action cost catalogue, surfaced to the client so the credit-pool UI
 * can render "1 credit / action" hints next to each action.
 */
export function listActionCosts(): Array<{ action: ActionKey; label: string; cost: number }> {
  return (Object.keys(CREDIT_COSTS) as ActionKey[]).map((action) => ({
    action,
    label: ACTION_LABELS[action],
    cost: CREDIT_COSTS[action],
  }))
}
