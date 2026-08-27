"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  GiftIcon,
  InformationCircleIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

import { useUsage } from "@/lib/hooks/use-me"

export function FreeTierCard({ onUpgrade }: { onUpgrade?: () => void }) {
  const usage = useUsage()
  if (!usage.data) return null
  if (usage.data.plan === "pro") return null

  const credits = usage.data.credits
  const balance = credits?.balance ?? 0
  const granted = credits?.lifetimeGranted ?? 0
  const consumed = credits?.lifetimeConsumed ?? 0
  // Progress against lifetime grant - visualises "you've used X of total earned".
  const denominator = Math.max(granted, 1)
  const pct = Math.min(100, Math.round((consumed / denominator) * 100))

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-3" />
          Free plan
        </span>
        <div className="flex items-center gap-1">
          <CreditInfoPopover />
          <button
            type="button"
            onClick={onUpgrade}
            className="text-[11px] font-semibold uppercase tracking-wide text-foreground hover:underline"
          >
            Upgrade
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground/90">Credits</span>
          <span className="tabular-nums text-muted-foreground">
            {balance}
            <span className="text-foreground/40"> / {granted}</span>
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full bg-foreground transition-[width]")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          1 credit = 1 summary, flashcard set, quiz, mindmap, course, transcription
          or chat message.
        </p>
      </div>

      <Link
        href="/free-credits"
        className="-mx-1 -mb-1 flex items-center gap-1.5 rounded-md px-1 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-accent/40 hover:underline"
      >
        <HugeiconsIcon icon={GiftIcon} strokeWidth={2} className="size-3" />
        Get more free credits
      </Link>
    </div>
  )
}

function CreditInfoPopover() {
  return (
    <Popover>
      <PopoverTrigger
        className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
        aria-label="How credits work"
      >
        <HugeiconsIcon
          icon={InformationCircleIcon}
          strokeWidth={2}
          className="size-3.5"
        />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[320px] gap-3"
      >
        <div className="space-y-1">
          <p className="font-heading text-[15px] font-medium">
            How credits work
          </p>
          <p className="text-[12px] text-muted-foreground">
            Every AI action - summary, flashcards, quiz, mindmap, course,
            transcription, or chat message - costs 1 credit. Credits never
            expire and you can earn more for free.
          </p>
        </div>
        <Link
          href="/free-credits"
          className="flex items-center justify-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-accent/40"
        >
          <HugeiconsIcon icon={GiftIcon} strokeWidth={2} className="size-3.5" />
          Earn more free credits
        </Link>
      </PopoverContent>
    </Popover>
  )
}
