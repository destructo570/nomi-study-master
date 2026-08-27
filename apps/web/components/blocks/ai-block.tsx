"use client"

import type { ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { MagicWand01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@workspace/ui/lib/utils"

type AiBlockProps = {
  label?: string
  children: ReactNode
  className?: string
}

export function AiBlock({ label = "AI generated", children, className }: AiBlockProps) {
  return (
    <div
      className={cn(
        "space-y-2 rounded-2xl border border-dashed border-foreground/15 bg-muted/30 p-4",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <HugeiconsIcon icon={MagicWand01Icon} strokeWidth={2} className="size-3.5" />
        {label}
      </div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  )
}
