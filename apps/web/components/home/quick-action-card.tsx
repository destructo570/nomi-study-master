"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import type { Upload01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@workspace/ui/lib/utils"

type QuickActionCardProps = {
  icon: typeof Upload01Icon
  title: string
  subtitle: string
  badge?: string | null
  onClick: () => void
  disabled?: boolean
  tint?: string
}

export function QuickActionCard({
  icon,
  title,
  subtitle,
  badge,
  onClick,
  disabled,
  tint,
}: QuickActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex h-[120px] flex-col items-start justify-between rounded-2xl border border-border p-4 text-left transition",
        tint ?? "bg-card",
        "hover:border-foreground/25 hover:shadow-hairline",
        "disabled:cursor-not-allowed disabled:opacity-60",
      )}
    >
      <div className="flex w-full items-start justify-between">
        <span className="flex size-7 items-center justify-center text-foreground">
          <HugeiconsIcon icon={icon} strokeWidth={2} className="size-5" />
        </span>
        {badge && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
            {badge}
          </span>
        )}
      </div>
      <div className="space-y-0.5">
        <div className="text-[15px] font-medium leading-tight">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </button>
  )
}
