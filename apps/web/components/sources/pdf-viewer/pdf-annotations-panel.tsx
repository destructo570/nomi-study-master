"use client"

import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  Delete02Icon,
  Search01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import type { Annotation } from "@workspace/types"

import { COLOR_STYLES } from "./types"

type PdfAnnotationsPanelProps = {
  annotations: Annotation[]
  onClose: () => void
  onJumpToAnnotation: (annotation: Annotation) => void
  onDeleteAnnotation: (annotationId: string) => void
}

export function PdfAnnotationsPanel({
  annotations,
  onClose,
  onJumpToAnnotation,
  onDeleteAnnotation,
}: PdfAnnotationsPanelProps) {
  const [query, setQuery] = useState("")
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return annotations
    return annotations.filter((a) => {
      if (a.quotedText.toLowerCase().includes(q)) return true
      if (a.comment && a.comment.toLowerCase().includes(q)) return true
      return false
    })
  }, [annotations, query])

  return (
    <div className="flex w-72 shrink-0 flex-col border-r border-border bg-background">
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-sm font-medium">Annotations</span>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={onClose}
          aria-label="Close"
        >
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
        </Button>
      </div>
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-2.5 py-2">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="size-4 text-muted-foreground"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search annotations…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {annotations.length === 0 ? (
          <p className="px-1 py-3 text-xs text-muted-foreground">
            Select text in the PDF and pick a color to create your first
            highlight.
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-1 py-3 text-xs text-muted-foreground">
            No matching annotations.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {filtered.map((a) => {
              const style = COLOR_STYLES[a.color] ?? COLOR_STYLES.yellow
              const isConfirming = confirmingDelete === a.id
              return (
                <li key={a.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onJumpToAnnotation(a)}
                    className={cn(
                      "flex w-full gap-2 rounded-lg border border-border bg-background p-2 pr-8 text-left text-xs transition-colors hover:bg-muted",
                    )}
                  >
                    <span
                      className={cn("w-1 shrink-0 rounded-full", style.dot)}
                    />
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="block truncate font-medium text-foreground">
                        {a.quotedText || "Highlight"}
                      </span>
                      {a.comment && (
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {a.comment}
                        </span>
                      )}
                      <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                        Page {a.page}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(a.id)}
                    aria-label="Delete annotation"
                    className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      strokeWidth={2}
                      className="size-3.5"
                    />
                  </button>
                  {isConfirming && (
                    <div
                      className="absolute inset-0 flex items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-background/95 px-3 text-xs animate-in fade-in-0 duration-150 supports-backdrop-filter:backdrop-blur-sm"
                      role="alertdialog"
                      aria-label="Confirm delete annotation"
                    >
                      <span className="font-medium text-foreground">
                        Confirm delete?
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setConfirmingDelete(null)}
                          aria-label="Cancel"
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <HugeiconsIcon
                            icon={Cancel01Icon}
                            strokeWidth={2}
                            className="size-4"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteAnnotation(a.id)
                            setConfirmingDelete(null)
                          }}
                          aria-label="Confirm delete"
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <HugeiconsIcon
                            icon={Tick02Icon}
                            strokeWidth={2}
                            className="size-4"
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
