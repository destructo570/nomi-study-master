import type { Plan, SubscriptionTier } from "./index"

export type { Plan, SubscriptionTier }

export const SUBSCRIPTION_TIERS = ["weekly", "monthly", "yearly"] as const

export type TierPricing = {
  tier: SubscriptionTier
  priceUsd: number
  priceLabel: string
  cadenceLabel: string
  intervalLabel: string
}

export const TIER_PRICES: Record<SubscriptionTier, number> = {
  weekly: 6.99,
  monthly: 9.99,
  yearly: 59.99,
}

const CADENCE_LABELS: Record<SubscriptionTier, string> = {
  weekly: "per week",
  monthly: "per month",
  yearly: "per year",
}

const INTERVAL_LABELS: Record<SubscriptionTier, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
}

export const TIER_PRICING: Record<SubscriptionTier, TierPricing> = Object.fromEntries(
  SUBSCRIPTION_TIERS.map((tier) => {
    const priceUsd = TIER_PRICES[tier]
    return [
      tier,
      {
        tier,
        priceUsd,
        priceLabel: `$${priceUsd.toFixed(2)}`,
        cadenceLabel: CADENCE_LABELS[tier],
        intervalLabel: INTERVAL_LABELS[tier],
      },
    ]
  })
) as Record<SubscriptionTier, TierPricing>

export function isSubscriptionTier(v: unknown): v is SubscriptionTier {
  return v === "weekly" || v === "monthly" || v === "yearly"
}

export const PLAN_LIMITS = {
  free: {
    fileBytes: 5 * 1024 * 1024,
    // Per-file cap for audio/video. Held at the same 5 MB as documents on
    // free — the 20-min duration cap is the real ceiling.
    mediaFileBytes: 5 * 1024 * 1024,
    pdfPages: 50,
    maxChunksPerDoc: 400,
    notebooks: 2,
    // Audio/video duration cap. Whisper-class transcription is the most
    // expensive per-request thing we run; without this a single 10-hour
    // upload on the free tier costs more than a paid month.
    mediaDurationSec: 20 * 60,
    // Aggregate live (non-archived) storage cap per user. Without this a
    // user can upload many small files until R2 storage charges add up.
    totalStorageBytes: 100 * 1024 * 1024,
  },
  pro: {
    fileBytes: 100 * 1024 * 1024,
    // Audio/video on pro can run up to a 2-hour duration; at HD video bit
    // rates that easily clears 100 MB. 1 GB is the per-file ceiling.
    mediaFileBytes: 1024 * 1024 * 1024,
    pdfPages: 200,
    maxChunksPerDoc: 2000,
    notebooks: -1,
    mediaDurationSec: 2 * 60 * 60,
    totalStorageBytes: 5 * 1024 * 1024 * 1024,
  },
} as const

export type UploadKind = "document" | "media"

export function notebookLimit(plan: Plan): number {
  return PLAN_LIMITS[plan].notebooks
}

export const FLASHCARD_COUNTS = [5, 10, 15] as const
export const QUIZ_COUNTS = [10, 15, 25, 50] as const

export type FlashcardCount = (typeof FLASHCARD_COUNTS)[number]
export type QuizCount = (typeof QUIZ_COUNTS)[number]

const FREE_FLASHCARD_COUNTS = new Set<number>([5, 10, 15])
const FREE_QUIZ_COUNTS = new Set<number>([10, 15])

export function isPro(plan: Plan): boolean {
  return plan === "pro"
}

export function fileByteLimit(plan: Plan, kind?: UploadKind): number {
  if (kind === "media") return PLAN_LIMITS[plan].mediaFileBytes
  return PLAN_LIMITS[plan].fileBytes
}

export function pdfPageLimit(plan: Plan): number {
  return PLAN_LIMITS[plan].pdfPages
}

export function maxChunksPerDoc(plan: Plan): number {
  return PLAN_LIMITS[plan].maxChunksPerDoc
}

export function mediaDurationLimitSec(plan: Plan): number {
  return PLAN_LIMITS[plan].mediaDurationSec
}

export function totalStorageLimit(plan: Plan): number {
  return PLAN_LIMITS[plan].totalStorageBytes
}

export function formatDuration(sec: number): string {
  if (sec >= 3600) {
    const h = Math.floor(sec / 3600)
    const m = Math.round((sec % 3600) / 60)
    return m === 0 ? `${h} hr` : `${h} hr ${m} min`
  }
  return `${Math.round(sec / 60)} min`
}

export function isFlashcardCountAllowed(count: number, plan: Plan): boolean {
  if (plan === "pro") return (FLASHCARD_COUNTS as readonly number[]).includes(count)
  return FREE_FLASHCARD_COUNTS.has(count)
}

export function isQuizCountAllowed(count: number, plan: Plan): boolean {
  if (plan === "pro") return (QUIZ_COUNTS as readonly number[]).includes(count)
  return FREE_QUIZ_COUNTS.has(count)
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}
