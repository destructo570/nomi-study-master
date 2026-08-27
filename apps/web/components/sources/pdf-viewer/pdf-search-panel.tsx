"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { pdfjs } from "react-pdf"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

const INITIAL_LIMIT = 10
const PAGE_INCREMENT = 10
const SNIPPET_RADIUS = 50

type Match = {
  page: number
  snippet: string
  highlightStart: number
  highlightEnd: number
}

type PdfSearchPanelProps = {
  src: string
  numPages: number
  onClose: () => void
  onJumpToPage: (page: number) => void
}

export function PdfSearchPanel({
  src,
  numPages,
  onClose,
  onJumpToPage,
}: PdfSearchPanelProps) {
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [pageTexts, setPageTexts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(INITIAL_LIMIT)
  const cancelRef = useRef(false)

  useEffect(() => {
    cancelRef.current = false
    if (!numPages) return
    setLoading(true)
    setPageTexts([])
    ;(async () => {
      try {
        const task = pdfjs.getDocument({ url: src })
        const pdf = await task.promise
        const texts: string[] = []
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelRef.current) return
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          const text = content.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ")
          texts.push(text)
        }
        if (!cancelRef.current) setPageTexts(texts)
      } finally {
        if (!cancelRef.current) setLoading(false)
      }
    })()
    return () => {
      cancelRef.current = true
    }
  }, [src, numPages])

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 200)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    setLimit(INITIAL_LIMIT)
  }, [debounced])

  const matches = useMemo<Match[]>(() => {
    if (!debounced || pageTexts.length === 0) return []
    const needle = debounced.toLowerCase()
    const results: Match[] = []
    for (let i = 0; i < pageTexts.length; i++) {
      const text = pageTexts[i]
      if (!text) continue
      const lower = text.toLowerCase()
      let from = 0
      while (true) {
        const idx = lower.indexOf(needle, from)
        if (idx < 0) break
        const start = Math.max(0, idx - SNIPPET_RADIUS)
        const end = Math.min(text.length, idx + needle.length + SNIPPET_RADIUS)
        const snippet =
          (start > 0 ? "…" : "") +
          text.slice(start, end).replace(/\s+/g, " ").trim() +
          (end < text.length ? "…" : "")
        const hStart =
          (start > 0 ? 1 : 0) +
          text.slice(start, idx).replace(/\s+/g, " ").trim().length +
          (start > 0 ? 1 : 0)
        results.push({
          page: i + 1,
          snippet,
          highlightStart: hStart,
          highlightEnd: hStart + needle.length,
        })
        from = idx + needle.length
        if (results.length > 200) break
      }
      if (results.length > 200) break
    }
    return results
  }, [debounced, pageTexts])

  const visible = matches.slice(0, limit)

  return (
    <div className="flex w-72 shrink-0 flex-col border-r border-border bg-background">
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-sm font-medium">Search</span>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={onClose}
          aria-label="Close"
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            strokeWidth={2}
            className="size-4"
          />
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
            placeholder="Search PDF…"
            autoFocus
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {loading ? (
          <p className="px-1 py-3 text-xs text-muted-foreground">
            Indexing pages…
          </p>
        ) : !debounced ? (
          <p className="px-1 py-3 text-xs text-muted-foreground">
            Type to search across all pages.
          </p>
        ) : matches.length === 0 ? (
          <p className="px-1 py-3 text-xs text-muted-foreground">No matches.</p>
        ) : (
          <>
            <p className="px-1 pt-2 pb-1.5 text-xs font-medium text-muted-foreground">
              {matches.length} match{matches.length === 1 ? "" : "es"}
            </p>
            <ul className="space-y-1.5">
              {visible.map((m, i) => (
                <li key={`${m.page}-${i}`}>
                  <button
                    type="button"
                    onClick={() => onJumpToPage(m.page)}
                    className={cn(
                      "group block w-full rounded-lg border border-transparent bg-muted/40 px-3 py-2.5 text-left text-xs transition-colors hover:bg-muted"
                    )}
                  >
                    <p className="leading-snug text-foreground/90">
                      {m.snippet.slice(0, m.highlightStart)}
                      <mark className="rounded bg-foreground/15 px-0.5 text-foreground">
                        {m.snippet.slice(m.highlightStart, m.highlightEnd)}
                      </mark>
                      {m.snippet.slice(m.highlightEnd)}
                    </p>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Page {m.page}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
            {matches.length > visible.length && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3 w-full"
                onClick={() => setLimit(limit + PAGE_INCREMENT)}
              >
                Show More
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
