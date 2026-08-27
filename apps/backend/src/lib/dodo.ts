import DodoPayments from "dodopayments"

import type { SubscriptionTier } from "@workspace/types"

const apiKey = process.env.DODO_PAYMENTS_API_KEY
if (!apiKey) {
  console.warn(
    "[dodo] DODO_PAYMENTS_API_KEY is not set — billing endpoints will fail",
  )
}

const environment =
  process.env.DODO_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode"

export const dodo = new DodoPayments({
  bearerToken: apiKey ?? "missing",
  environment,
})

const PRODUCT_IDS: Record<SubscriptionTier, string | undefined> = {
  weekly: process.env.DODO_PRODUCT_WEEKLY,
  monthly: process.env.DODO_PRODUCT_MONTHLY,
  yearly: process.env.DODO_PRODUCT_YEARLY,
}

export function productIdForTier(tier: SubscriptionTier): string {
  const id = PRODUCT_IDS[tier]
  if (!id) {
    throw new Error(`Dodo product id for tier "${tier}" is not configured`)
  }
  return id
}

export function tierForProductId(
  productId: string | null | undefined,
): SubscriptionTier | null {
  if (!productId) return null
  for (const tier of ["weekly", "monthly", "yearly"] as const) {
    if (PRODUCT_IDS[tier] === productId) return tier
  }
  return null
}

export const DODO_WEBHOOK_KEY = process.env.DODO_WEBHOOK_KEY ?? ""
