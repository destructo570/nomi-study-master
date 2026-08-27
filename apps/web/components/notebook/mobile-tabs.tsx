"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"

import { cn } from "@workspace/ui/lib/utils"

export type NotebookTab = {
  value: string
  label: string
  icon: IconSvgElement
  activeBg: string
  activeRing: string
}

export function MobileNotebookTabs({
  tabs,
  active,
  onTabClick,
}: {
  tabs: NotebookTab[]
  active: string
  onTabClick: (value: string) => void
}) {
  return (
    <nav
      aria-label="Notebook sections"
      className="fixed inset-x-3 bottom-[max(env(safe-area-inset-bottom),0.75rem)] z-30 mx-auto flex max-w-md items-center justify-between gap-1 rounded-full border border-border bg-background/95 p-2 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)] backdrop-blur-sm md:hidden"
    >
      {tabs.map((t) => {
        const isActive = active === t.value
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onTabClick(t.value)}
            aria-label={t.label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm transition-colors",
              isActive
                ? cn(t.activeBg, t.activeRing, "text-foreground ring-1 ring-inset")
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <HugeiconsIcon
              icon={t.icon}
              strokeWidth={2}
              className={cn(
                "size-5 shrink-0",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
            />
            {isActive && <span className="whitespace-nowrap">{t.label}</span>}
          </button>
        )
      })}
    </nav>
  )
}
