import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
} from "@hugeicons/core-free-icons"

import { cn } from "@workspace/ui/lib/utils"

type StatProps = {
  label: string
  value: string
  delta?: { value: string; direction: "up" | "down" }
  footnote?: string
  className?: string
}

export function Stat({ label, value, delta, footnote, className }: StatProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <span className="font-heading text-3xl font-semibold tracking-tight">
          {value}
        </span>
        {delta && (
          <span
            className={
              delta.direction === "up" ? "delta-pill-up" : "delta-pill-down"
            }
          >
            <HugeiconsIcon
              icon={delta.direction === "up" ? ArrowUp01Icon : ArrowDown01Icon}
              strokeWidth={2}
              className="size-3"
            />
            {delta.value}
          </span>
        )}
      </div>
      {footnote && (
        <p className="text-xs text-muted-foreground">{footnote}</p>
      )}
    </div>
  )
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-6 border-t py-6 sm:grid-cols-2 lg:grid-cols-4">
      {children}
    </div>
  )
}
