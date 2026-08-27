"use client"

import type { Editor, Range } from "@tiptap/core"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"

import { cn } from "@workspace/ui/lib/utils"

export type SlashItem = {
  title: string
  description?: string
  icon: IconSvgElement
  keywords?: string[]
  run: (editor: Editor, range: Range) => void
}

type SlashMenuProps = {
  items: SlashItem[]
  selectedIndex: number
  onSelect: (item: SlashItem) => void
}

export function SlashMenu({ items, selectedIndex, onSelect }: SlashMenuProps) {
  if (items.length === 0) {
    return (
      <div className="w-64 rounded-2xl border bg-popover p-2 text-sm text-muted-foreground shadow-lg ring-1 ring-foreground/5">
        No matches
      </div>
    )
  }
  return (
    <div className="w-72 overflow-hidden rounded-2xl border bg-popover p-1 shadow-lg ring-1 ring-foreground/5">
      <ul className="max-h-80 space-y-0.5 overflow-y-auto">
        {items.map((item, i) => (
          <li key={item.title}>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                onSelect(item)
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-start text-sm transition",
                i === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/60",
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{item.title}</span>
                {item.description && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.description}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
