import type { SubscriptionStatus } from "@workspace/types"

const KNOWN_STATUSES: ReadonlySet<SubscriptionStatus> = new Set([
  "active",
  "on_hold",
  "cancelled",
  "expired",
  "failed",
  "pending",
])

export function normalizeStatus(
  value: string | null | undefined,
): SubscriptionStatus | null {
  if (!value) return null
  const v = value.toLowerCase()
  return KNOWN_STATUSES.has(v as SubscriptionStatus)
    ? (v as SubscriptionStatus)
    : null
}

export function nextPlanForStatus(
  status: SubscriptionStatus | null,
  periodEnd: Date | null,
  now: Date,
): "free" | "pro" {
  if (status === "active") return "pro"
  if (
    status === "cancelled" &&
    periodEnd &&
    !Number.isNaN(periodEnd.getTime()) &&
    periodEnd.getTime() > now.getTime()
  ) {
    return "pro"
  }
  return "free"
}
