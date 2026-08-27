"use client"

import { useEffect, useState } from "react"

import { cn } from "@workspace/ui/lib/utils"

import type { Chapter } from "@workspace/types"

type ChapterRailProps = {
  notebookId: string
  chapters: Chapter[]
  activeId: string | null
  onSelect: (id: string) => void
}

function storageKey(notebookId: string) {
  return `notebook:${notebookId}:read`
}

function loadReadIds(notebookId: string): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = window.localStorage.getItem(storageKey(notebookId))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? new Set(parsed) : new Set()
  } catch {
    return new Set()
  }
}

function saveReadIds(notebookId: string, ids: Set<string>) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(
      storageKey(notebookId),
      JSON.stringify([...ids]),
    )
  } catch {
    // ignore
  }
}

export function ChapterRail({
  notebookId,
  chapters,
  activeId,
  onSelect,
}: ChapterRailProps) {
  const [open, setOpen] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setReadIds(loadReadIds(notebookId))
  }, [notebookId])

  useEffect(() => {
    if (!activeId) return
    setReadIds((prev) => {
      if (prev.has(activeId)) return prev
      const next = new Set(prev)
      next.add(activeId)
      saveReadIds(notebookId, next)
      return next
    })
  }, [activeId, notebookId])

  if (chapters.length === 0) return null

  return (
    <aside
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="pointer-events-auto sticky top-0 z-10 h-full shrink-0"
      aria-label="Chapters"
    >
      <div className="flex h-full w-3 items-stretch pl-1">
        <div className="flex w-2 flex-col gap-[3px] py-6">
          {chapters.map((ch) => {
            const active = ch.id === activeId
            const read = readIds.has(ch.id)
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => onSelect(ch.id)}
                aria-label={ch.title}
                className={cn(
                  "flex-1 rounded-full transition-colors",
                  active
                    ? "bg-primary"
                    : read
                      ? "bg-foreground/40"
                      : "bg-muted",
                )}
              />
            )
          })}
        </div>
      </div>

      <div
        className={cn(
          "absolute left-3 top-2 z-10 w-64 rounded-r-xl border bg-background py-2 shadow-lg transition-opacity duration-150",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      >
        <h2 className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Chapters
        </h2>
        <ol className="space-y-0.5 px-1">
          {chapters.map((ch, i) => {
            const active = ch.id === activeId
            return (
              <li key={ch.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(ch.id)
                    setOpen(false)
                  }}
                  className={cn(
                    "group flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:bg-foreground/10",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate leading-5">
                    {ch.title}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </aside>
  )
}
