"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import posthog from "posthog-js"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { Button, buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { TIER_PRICING, type SubscriptionTier } from "@workspace/types/plan"

import { api } from "@/lib/api"

export type TierCard = {
  tier: SubscriptionTier
  name: string
  price: string
  cadence: string
  highlight: boolean
  badge?: string
  caption?: string
  subCaption?: string
  ctaLabel?: string
  features: string[]
}

export const PRO_FEATURES = [
  "Unlimited notes and summaries",
  "Unlimited AI Chats",
  "Unlimited flashcards & quizzes",
  "Unlimited mindmaps",
  "Support for 50+ languages",
  "Support for much higher file size limits and audio transcriptions",
  "Up to 2-hour transcriptions",
  "Customer support 24/7",
  "And more...",
]

const YEARLY_EARLY_CHIPS: string[] = []

const yearlySavingsPct = 72

export const PRO_TIERS: TierCard[] = [
  {
    tier: "weekly",
    name: "Weekly",
    price: TIER_PRICING.weekly.priceLabel,
    cadence: TIER_PRICING.weekly.cadenceLabel,
    highlight: false,
    caption: "Try Pro short-term",
    features: PRO_FEATURES,
  },
  {
    tier: "monthly",
    name: "Monthly",
    price: TIER_PRICING.monthly.priceLabel,
    cadence: TIER_PRICING.monthly.cadenceLabel,
    highlight: false,
    caption: "Popular",
    features: PRO_FEATURES,
  },
  {
    tier: "yearly",
    name: "Yearly",
    price: TIER_PRICING.yearly.priceLabel,
    cadence: TIER_PRICING.yearly.cadenceLabel,
    highlight: true,
    badge: `Save ${yearlySavingsPct}%`,
    caption: "Best Value",
    ctaLabel: `Select Plan & Save ${yearlySavingsPct}%`,
    features: PRO_FEATURES,
  },
]

export function PricingPanel({
  ctaLabel,
  href,
  showImage = true,
  imageSrc = "/images/tiger-stars.webp",
  footnote,
  defaultTier = "yearly",
  className,
}: {
  ctaLabel: string
  /** When set, the CTA is a Link to this URL. Otherwise it triggers Stripe checkout. */
  href?: string
  /** Hide the left-side image (modal contexts where it competes with the headline). */
  showImage?: boolean
  imageSrc?: string
  footnote?: string
  defaultTier?: SubscriptionTier
  className?: string
}) {
  const [tierId, setTierId] = useState<SubscriptionTier>(defaultTier)
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const selected = PRO_TIERS.find((p) => p.tier === tierId) ?? PRO_TIERS[2]!

  const OFFER_KEY = "pricing-offer-deadline"
  const OFFER_MS = 6 * 60 * 60 * 1000

  useEffect(() => {
    if (typeof window === "undefined") return
    let deadline = Number(window.localStorage.getItem(OFFER_KEY) ?? 0)
    const now = Date.now()
    if (!deadline || deadline <= now) {
      deadline = now + OFFER_MS
      window.localStorage.setItem(OFFER_KEY, String(deadline))
    }
    const tick = () => setRemaining(Math.max(0, deadline - Date.now()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [OFFER_KEY])

  const offerHours = Math.floor(remaining / 3_600_000)
  const offerMinutes = Math.floor((remaining % 3_600_000) / 60_000)
  const offerSeconds = Math.floor((remaining % 60_000) / 1000)
  const offerTimer = `${String(offerHours).padStart(2, "0")}:${String(
    offerMinutes,
  ).padStart(2, "0")}:${String(offerSeconds).padStart(2, "0")}`

  async function handleCheckout() {
    if (loading) return
    setLoading(true)
    posthog.capture("checkout_started", {
      tier: selected.tier,
      price_label: selected.price,
    })
    try {
      const res = await api.createCheckout(selected.tier)
      window.location.href = res.checkoutUrl
    } catch (err) {
      console.error("[checkout]", err)
      posthog.captureException(err)
      posthog.capture("checkout_failed", {
        tier: selected.tier,
        message: err instanceof Error ? err.message : String(err),
      })
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not start checkout. Try again in a moment.",
      )
      setLoading(false)
    }
  }

  return (
    <div className={className}>
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-pill border border-border bg-background p-1 shadow-hairline">
          {PRO_TIERS.map((p) => {
            const active = tierId === p.tier
            return (
              <button
                key={p.tier}
                type="button"
                onClick={() => setTierId(p.tier)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-pill px-4 py-2 text-[13px] font-medium transition sm:text-[14px]",
                  active
                    ? p.tier === "yearly"
                      ? "bg-[#fde4d3] text-[#9a3412]"
                      : "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p.name}
                {p.badge && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]",
                      active
                        ? "bg-[#32373C] text-background"
                        : "bg-foreground text-background",
                    )}
                  >
                    {p.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div
        className="mx-auto mt-8 grid max-w-[980px] overflow-hidden rounded-[12px] border border-border bg-card md:grid-cols-2"
        style={{
          boxShadow:
            "rgba(0, 0, 0, 0.4) 0px 0px 1px 0px, rgba(0, 0, 0, 0.08) 0px 12px 32px -12px",
        }}
      >
        <AnimatePresence initial={false}>
          {selected.tier === "yearly" && remaining > 0 && (
            <motion.div
              key="offer-banner"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden md:col-span-2"
            >
              <div className="flex items-center justify-between gap-3 bg-[#fde4d3] px-4 py-2 text-[#9a3412]">
                <span className="text-[11px] font-semibold leading-tight sm:text-[12px]">
                  One Time Offer | 🚀 75% off for a limited time only!
                </span>
                <span className="font-mono text-[13px] font-semibold tabular-nums leading-none sm:text-[14px]">
                  {offerTimer}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex flex-col items-center p-8 text-center sm:p-10">
          {showImage && (
            <Image
              src={imageSrc}
              alt=""
              width={954}
              height={502}
              className="h-auto w-full max-w-[260px] sm:max-w-[300px]"
              aria-hidden="true"
            />
          )}
          <div
            className={cn(
              "flex items-baseline gap-2",
              showImage ? "mt-6" : "mt-2",
            )}
          >
            <span className="font-display text-[48px] font-light leading-none tracking-[-0.02em] sm:text-[56px]">
              {selected.price}
            </span>
            <span className="text-[13px] text-muted-foreground">
              {selected.cadence}
            </span>
          </div>
          {selected.caption &&
            (selected.tier === "yearly" ? (
              <span className="mt-3 inline-flex items-center rounded-full bg-[#dcefdc] px-3 py-1 text-[12px] font-medium text-[#274f29]">
                {selected.caption}
              </span>
            ) : selected.tier === "monthly" ? (
              <span className="mt-3 inline-flex items-center rounded-full bg-[#fbe1ea] px-3 py-1 text-[12px] font-medium text-[#7a2244]">
                {selected.caption}
              </span>
            ) : (
              <p className="mt-2 text-[12px] text-muted-foreground">
                {selected.caption}
              </p>
            ))}
          {selected.subCaption && (
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              {selected.subCaption}
            </p>
          )}

          {href ? (
            <Link
              href={href}
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-7 h-11 rounded-pill px-7 text-sm",
              )}
            >
              {selected.ctaLabel ?? ctaLabel}
            </Link>
          ) : (
            <Button
              size="lg"
              className="mt-7 h-11 rounded-pill px-7 text-sm"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? "Starting…" : (selected.ctaLabel ?? ctaLabel)}
            </Button>
          )}
          {selected.tier === "yearly" && (
            <div className="mt-4 flex flex-wrap gap-2">
              {YEARLY_EARLY_CHIPS.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center rounded-full bg-[#fde4d3] px-3 py-1 text-[12px] font-semibold text-[#9a3412]"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border p-8 sm:p-10 md:border-l md:border-t-0">
          <ul className="space-y-3">
            {selected.features.map((f) => (
              <li
                key={f}
                className="flex items-start gap-3 text-[14px] leading-[1.5] text-foreground sm:text-[15px]"
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  strokeWidth={2}
                  className="mt-0.5 size-4 shrink-0 text-foreground"
                />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {footnote && (
        <p className="mx-auto mt-8 max-w-[640px] text-center text-[12px] text-muted-foreground">
          {footnote}
        </p>
      )}
    </div>
  )
}
