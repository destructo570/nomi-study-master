"use client"

import type { ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  IdeaIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "@workspace/ui/lib/utils"

export type CalloutVariant = "info" | "tip" | "warning" | "success"

type CalloutBlockProps = {
  variant?: CalloutVariant
  title?: string
  children: ReactNode
  className?: string
}

// All callouts share the same neutral surface - the icon carries the meaning.
// Warning is the one exception: it uses `destructive` since it's a genuine
// error state, not a tonal variation.
const variants: Record<
  CalloutVariant,
  { icon: IconSvgElement; container: string; iconClass: string }
> = {
  info: {
    icon: InformationCircleIcon,
    container: "border-border bg-muted/40",
    iconClass: "text-foreground",
  },
  tip: {
    icon: IdeaIcon,
    container: "border-border bg-muted/40",
    iconClass: "text-foreground",
  },
  warning: {
    icon: Alert02Icon,
    container: "border-destructive/30 bg-destructive/5",
    iconClass: "text-destructive",
  },
  success: {
    icon: CheckmarkCircle02Icon,
    container: "border-border bg-muted/40",
    iconClass: "text-foreground",
  },
}

export function CalloutBlock({
  variant = "info",
  title,
  children,
  className,
}: CalloutBlockProps) {
  const v = variants[variant]
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border p-4 text-sm",
        v.container,
        className,
      )}
    >
      <HugeiconsIcon
        icon={v.icon}
        strokeWidth={2}
        className={cn("mt-0.5 size-4 shrink-0", v.iconClass)}
      />
      <div className="space-y-1">
        {title && <p className="font-medium">{title}</p>}
        <div className="leading-relaxed text-foreground/90">{children}</div>
      </div>
    </div>
  )
}
