"use client"

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { MagicWand01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"

type ComingSoonProps = {
  title: string
  description: string
  icon: IconSvgElement
  cta?: string
}

export function ComingSoon({ title, description, icon, cta = "Generate" }: ComingSoonProps) {
  return (
    <div className="mx-auto max-w-4xl px-8 pt-8 pb-16">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <HugeiconsIcon icon={icon} strokeWidth={2} className="size-6" />
        </span>
        <p className="text-sm text-muted-foreground">
          Nothing here yet. Generate {title.toLowerCase()} from your notebook content.
        </p>
        <Button size="sm" disabled>
          <HugeiconsIcon icon={MagicWand01Icon} strokeWidth={2} className="size-4" />
          {cta}
        </Button>
        <p className="text-[11px] text-muted-foreground/70">Coming soon</p>
      </div>
    </div>
  )
}
