"use client"

import { useEffect, useState } from "react"
import posthog from "posthog-js"
import { HugeiconsIcon } from "@hugeicons/react"
import { SparklesIcon } from "@hugeicons/core-free-icons"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"

import {
  subscribeUpgradeModal,
  type UpgradeReason,
} from "@/lib/upgrade-trigger"
import { PricingPanel } from "./plan-card"

function reasonHeadline(reason: UpgradeReason | null): {
  title: string
  description: string
} {
  if (!reason) {
    return {
      title: "Choose your plan",
      description: "Pick the cadence that fits how you study.",
    }
  }
  if (reason.kind === "notebook_limit") {
    return {
      title: "Notebook limit reached",
      description: `Free plans are capped at ${reason.limit} active notebooks. Upgrade to keep creating.`,
    }
  }
  if (reason.kind === "quota_exceeded") {
    return {
      title: "You're out of credits",
      description:
        "Free accounts share a single credit pool - every AI action costs 1 credit. Upgrade to Pro for unlimited use, or earn more credits from the Free credits page.",
    }
  }
  if (reason.kind === "pro_only") {
    return {
      title: `${reason.feature} are a Pro feature`,
      description: `Upgrade to Pro to unlock ${reason.feature.toLowerCase()} and the rest of the workspace at full speed.`,
    }
  }
  return {
    title: "Choose your plan",
    description: "Pick the cadence that fits how you study.",
  }
}

export function UpgradeModalProvider() {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<UpgradeReason | null>(null)

  useEffect(() => {
    return subscribeUpgradeModal((next) => {
      setReason(next)
      setOpen(true)
      posthog.capture("upgrade_modal_shown", {
        reason: next?.kind ?? "manual",
        ...(next?.kind === "notebook_limit" ? { limit: next.limit } : {}),
        ...(next?.kind === "quota_exceeded" ? { action: next.action } : {}),
        ...(next?.kind === "pro_only" ? { feature: next.feature } : {}),
      })
    })
  }, [])

  const { title, description } = reasonHeadline(reason)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!max-w-[1040px] sm:!max-w-[1040px]">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
            <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="font-display text-[22px] font-light tracking-[-0.02em]">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] text-muted-foreground">
              {description}
            </DialogDescription>
          </div>
        </div>

        <PricingPanel
          ctaLabel="Select Plan"
          className="mt-2"
          footnote="Cancel anytime - billing stops at the end of the period."
        />
      </DialogContent>
    </Dialog>
  )
}
