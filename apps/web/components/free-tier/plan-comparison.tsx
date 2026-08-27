"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"

import {
  PLAN_LIMITS,
  formatBytes,
  formatDuration,
} from "@workspace/types/plan"
import { FREE_STARTER_CREDITS } from "@workspace/types/quotas"
import { cn } from "@workspace/ui/lib/utils"

type Row = {
  label: string
  free: string
  pro: string
}

const ROWS: Row[] = [
  {
    label: "AI generations",
    free: `${FREE_STARTER_CREDITS} credits, 1 per action`,
    pro: "Unlimited",
  },
  {
    label: "Notebooks",
    free: `${PLAN_LIMITS.free.notebooks}`,
    pro: "Unlimited",
  },
  {
    label: "PDF pages",
    free: `${PLAN_LIMITS.free.pdfPages}`,
    pro: `${PLAN_LIMITS.pro.pdfPages}`,
  },
  {
    label: "Document size",
    free: formatBytes(PLAN_LIMITS.free.fileBytes),
    pro: formatBytes(PLAN_LIMITS.pro.fileBytes),
  },
  {
    label: "Audio / video size",
    free: formatBytes(PLAN_LIMITS.free.mediaFileBytes),
    pro: formatBytes(PLAN_LIMITS.pro.mediaFileBytes),
  },
  {
    label: "Audio / video length",
    free: `${formatDuration(PLAN_LIMITS.free.mediaDurationSec)} max`,
    pro: `${formatDuration(PLAN_LIMITS.pro.mediaDurationSec)} max`,
  },
  {
    label: "Total storage",
    free: formatBytes(PLAN_LIMITS.free.totalStorageBytes),
    pro: formatBytes(PLAN_LIMITS.pro.totalStorageBytes),
  },
]

export function PlanComparison({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border",
        className,
      )}
    >
      <div className="grid grid-cols-[1.1fr_1fr_1fr] bg-muted/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        <span></span>
        <span>Free</span>
        <span>Pro</span>
      </div>
      <ul className="divide-y divide-border">
        {ROWS.map((row) => (
          <li
            key={row.label}
            className="grid grid-cols-[1.1fr_1fr_1fr] items-center px-3 py-2 text-[12px]"
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span className="tabular-nums">{row.free}</span>
            <span className="font-medium tabular-nums">{row.pro}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const FEATURE_ROWS: Array<{ label: string; free: boolean; pro: boolean }> = [
  { label: "Summaries, flashcards, quizzes", free: true, pro: true },
  { label: "Mindmaps & courses", free: true, pro: true },
  { label: "Tutor chat", free: true, pro: true },
  { label: "Audio transcription", free: true, pro: true },
  { label: "Priority queue", free: false, pro: true },
]

export function PlanFeatureMatrix({ className }: { className?: string }) {
  return (
    <ul
      className={cn(
        "overflow-hidden rounded-xl border border-border divide-y divide-border",
        className,
      )}
    >
      {FEATURE_ROWS.map((row) => (
        <li
          key={row.label}
          className="grid grid-cols-[1.1fr_1fr_1fr] items-center px-3 py-2 text-[12px]"
        >
          <span className="text-muted-foreground">{row.label}</span>
          <span>
            <HugeiconsIcon
              icon={row.free ? CheckmarkCircle02Icon : Cancel01Icon}
              strokeWidth={2}
              className={cn(
                "size-3.5",
                row.free ? "text-foreground" : "text-foreground/30",
              )}
            />
          </span>
          <span>
            <HugeiconsIcon
              icon={row.pro ? CheckmarkCircle02Icon : Cancel01Icon}
              strokeWidth={2}
              className={cn(
                "size-3.5",
                row.pro ? "text-foreground" : "text-foreground/30",
              )}
            />
          </span>
        </li>
      ))}
    </ul>
  )
}
