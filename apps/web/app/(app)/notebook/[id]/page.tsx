"use client"

import React, { use, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Brain01Icon,
  Cards01Icon,
  File01Icon,
  FullscreenIcon,
  HelpSquareIcon,
  Mic01Icon,
  ParagraphBulletsPoint01Icon,
  SquareArrowShrink01Icon,
  StickyNote02Icon,
} from "@hugeicons/core-free-icons"

import { cn } from "@workspace/ui/lib/utils"

import { AiPanel } from "@/components/ai-panel/ai-panel"
import { MobileChatFab } from "@/components/ai-panel/mobile-chat-fab"
import { SelectionToChat } from "@/components/ai-panel/selection-to-chat"
import { MobileNotebookTabs } from "@/components/notebook/mobile-tabs"
import { DocumentTitle } from "@/components/seo/document-title"
import { api } from "@/lib/api"
import { useNotebook } from "@/lib/hooks/use-workspace"
import { qk } from "@/lib/query-keys"

import NotebookSourcePage from "./source/page"
import NotebookSummaryPage from "./summary/page"
import NotebookFlashcardsPage from "./flashcards/page"
import NotebookQuizzesPage from "./quizzes/page"
import NotebookMindmapPage from "./mindmap/page"
import NotebookPodcastPage from "./podcast/page"
import NotebookNotesPage from "./notes/page"

const TAB_PAGES: Record<string, React.ComponentType<{ params: Promise<{ id: string }> }>> = {
  source: NotebookSourcePage,
  summary: NotebookSummaryPage,
  flashcards: NotebookFlashcardsPage,
  quizzes: NotebookQuizzesPage,
  mindmap: NotebookMindmapPage,
  podcast: NotebookPodcastPage,
  notes: NotebookNotesPage,
}

const TABS = [
  { value: "source", label: "Source", icon: File01Icon, activeBg: "bg-[#dbeafe]/60", activeRing: "ring-[#93c5fd]/50" },
  { value: "summary", label: "Summary", icon: ParagraphBulletsPoint01Icon, activeBg: "bg-[#e5e7eb]/60", activeRing: "ring-[#9ca3af]/50" },
  { value: "flashcards", label: "Flashcards", icon: Cards01Icon, activeBg: "bg-[#ede9fe]/60", activeRing: "ring-[#c4b5fd]/50" },
  { value: "quizzes", label: "Quizzes", icon: HelpSquareIcon, activeBg: "bg-[#d1fae5]/60", activeRing: "ring-[#6ee7b7]/50" },
  { value: "mindmap", label: "Mindmap", icon: Brain01Icon, activeBg: "bg-[#fce7f3]/60", activeRing: "ring-[#f9a8d4]/50" },
  { value: "podcast", label: "Podcast", icon: Mic01Icon, activeBg: "bg-[#fef3c7]/60", activeRing: "ring-[#fcd34d]/50" },
  { value: "notes", label: "Notes", icon: StickyNote02Icon, activeBg: "bg-[#ffedd5]/60", activeRing: "ring-[#fdba74]/50" },
]

const PREFETCH_STALE = 5 * 60 * 1000
const PREFETCH_GC = 10 * 60 * 1000

type PrefetchConfig = {
  key: readonly string[]
  fn: () => Promise<unknown>
}

function buildPrefetchMap(id: string): Record<string, PrefetchConfig> {
  return {
    source: { key: qk.sources(id), fn: () => api.listSources(id) },
    summary: { key: qk.summaryHistory(id), fn: () => api.listSummaries(id) },
    flashcards: { key: qk.flashcards(id), fn: () => api.listFlashcards(id) },
    quizzes: { key: qk.quizzes(id), fn: () => api.listQuizzes(id) },
    mindmap: { key: qk.mindmaps(id), fn: () => api.listMindmaps(id) },
    podcast: { key: qk.podcast(id), fn: () => api.getPodcast(id) },
    notes: { key: qk.notebook(id), fn: () => api.getNotebook(id) },
  }
}

export default function NotebookPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const qc = useQueryClient()
  const notebookQuery = useNotebook(id)

  const prefetchMap = useMemo(() => buildPrefetchMap(id), [id])

  const prefetchedRef = useRef<Set<string>>(new Set())

  const [activeTab, setActiveTab] = useState("source")

  useEffect(() => {
    if (!id) return

    void qc.prefetchQuery({
      queryKey: qk.summary(id),
      queryFn: () => api.getSummary(id),
      staleTime: PREFETCH_STALE,
      gcTime: PREFETCH_GC,
    })
    void qc.prefetchQuery({
      queryKey: qk.chapters(id),
      queryFn: () => api.listChapters(id),
      staleTime: PREFETCH_STALE,
      gcTime: PREFETCH_GC,
    })
    void qc.prefetchQuery({
      queryKey: qk.chatSessions(id),
      queryFn: () => api.listChatSessions(id),
      staleTime: PREFETCH_STALE,
      gcTime: PREFETCH_GC,
    })
  }, [id, qc])

  const handleTabHover = useCallback(
    (value: string) => {
      const c = prefetchMap[value]
      if (!c) return
      const cacheKey = c.key.join(":")
      if (prefetchedRef.current.has(cacheKey)) return
      prefetchedRef.current.add(cacheKey)
      void qc.prefetchQuery({
        queryKey: c.key,
        queryFn: c.fn,
        staleTime: PREFETCH_STALE,
        gcTime: PREFETCH_GC,
      })
    },
    [prefetchMap, qc],
  )

  const handleTabClick = useCallback((value: string) => {
    setActiveTab(value)
  }, [])

  const paramsRef = useRef(params)
  paramsRef.current = params

  const [fullscreen, setFullscreen] = useState<"left" | "right" | null>(null)
  const isLeftFullscreen = fullscreen === "left"
  const isChatFullscreen = fullscreen === "right"

  const ASIDE_MIN = 320
  const ASIDE_MAX = 900
  const ASIDE_DEFAULT = 540
  const ASIDE_STORAGE_KEY = "arkive:notebook:asideWidth"
  const [asideWidth, setAsideWidth] = useState<number>(ASIDE_DEFAULT)
  const asideWidthRef = useRef(asideWidth)
  asideWidthRef.current = asideWidth

  useEffect(() => {
    const stored = window.localStorage.getItem(ASIDE_STORAGE_KEY)
    if (!stored) return
    const n = Number.parseInt(stored, 10)
    if (Number.isFinite(n)) {
      setAsideWidth(Math.min(ASIDE_MAX, Math.max(ASIDE_MIN, n)))
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(ASIDE_STORAGE_KEY, String(asideWidth))
  }, [asideWidth])

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false
      const tag = target.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
      if (target.isContentEditable) return true
      return false
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return
      if (!(event.metaKey || event.ctrlKey)) return
      if (event.altKey) return
      if (isTypingTarget(event.target)) return
      const key = event.key.toLowerCase()
      if (key === "b" && !event.shiftKey) {
        event.preventDefault()
        event.stopImmediatePropagation()
        setFullscreen((v) => (v === "right" ? null : "right"))
      } else if (key === "m" && !event.shiftKey) {
        event.preventDefault()
        event.stopImmediatePropagation()
        setFullscreen((v) => (v === "left" ? null : "left"))
      }
    }
    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [])

  const startResize = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = asideWidthRef.current
    const previousCursor = document.body.style.cursor
    const previousSelect = document.body.style.userSelect
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    function onMove(ev: PointerEvent) {
      const delta = startX - ev.clientX
      const next = Math.min(ASIDE_MAX, Math.max(ASIDE_MIN, startWidth + delta))
      setAsideWidth(next)
    }
    function onUp() {
      document.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerup", onUp)
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousSelect
    }
    document.addEventListener("pointermove", onMove)
    document.addEventListener("pointerup", onUp)
  }, [])

  const mainFlex = isChatFullscreen ? "0 0 0px" : "1 1 0%"
  const asideFlex = isChatFullscreen
    ? "1 1 0%"
    : isLeftFullscreen
      ? "0 0 0px"
      : `0 0 ${asideWidth}px`
  const showResizeHandle = !isLeftFullscreen && !isChatFullscreen

  return (
    <div className="flex h-[calc(100vh-2.5rem)] min-h-0 min-w-0 overflow-hidden p-2">
      <DocumentTitle title={notebookQuery.data?.title} />
      <main
        className={cn(
          "flex min-h-0 min-w-0 flex-col overflow-hidden bg-background",
          "transition-[flex-grow,flex-shrink,flex-basis,opacity] duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          isChatFullscreen && "pointer-events-none opacity-0",
        )}
        style={{ flex: mainFlex }}
      >
        <div className="hidden shrink-0 items-center gap-1 overflow-x-auto pt-2 pb-1.5 pl-2 pr-2 md:flex">
          {TABS.map((t) => {
            const isActive = activeTab === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => handleTabClick(t.value)}
                onMouseEnter={() => handleTabHover(t.value)}
                className={cn(
                  "group inline-flex shrink-0 items-center gap-1.5 rounded-4xl px-2.5 py-1.5 text-sm transition-colors",
                  isActive
                    ? cn(t.activeBg, t.activeRing, "text-foreground ring-1 ring-inset")
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <HugeiconsIcon
                  icon={t.icon}
                  strokeWidth={2}
                  className={cn(
                    "size-4",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                />
                <span>{t.label}</span>
              </button>
            )
          })}
          <button
            type="button"
            onClick={() =>
              setFullscreen((v) => (v === "left" ? null : "left"))
            }
            aria-label={
              isLeftFullscreen ? "Exit fullscreen" : "Expand content"
            }
            title={isLeftFullscreen ? "Exit fullscreen" : "Expand content"}
            className="ml-auto hidden size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:flex"
          >
            <HugeiconsIcon
              icon={isLeftFullscreen ? SquareArrowShrink01Icon : FullscreenIcon}
              strokeWidth={2}
              className="size-4"
            />
          </button>
        </div>
        <SelectionToChat className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto pb-20 md:pb-0">
          <div className="h-full w-full">
            {TABS.map((t) => {
              const Page = TAB_PAGES[t.value]!
              return (
                <div
                  key={t.value}
                  aria-hidden={activeTab !== t.value}
                  hidden={activeTab !== t.value}
                  className="h-full w-full"
                >
                  <Page params={params} />
                </div>
              )
            })}
          </div>
        </SelectionToChat>
      </main>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize chat panel"
        onPointerDown={showResizeHandle ? startResize : undefined}
        className={cn(
          "hidden w-2 shrink-0 py-3 transition-opacity duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] md:block",
          showResizeHandle ? "cursor-col-resize opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="mx-auto h-full w-[0.5px] bg-border" />
      </div>
      <aside
        className={cn(
          "hidden min-h-0 flex-col overflow-hidden md:flex",
          "transition-[flex-grow,flex-shrink,flex-basis,opacity] duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          isLeftFullscreen && "pointer-events-none opacity-0",
        )}
        style={{ flex: asideFlex }}
      >
        <AiPanel
          notebookId={id}
          isFullscreen={isChatFullscreen}
          onToggleFullscreen={() =>
            setFullscreen((v) => (v === "right" ? null : "right"))
          }
        />
      </aside>
      <MobileNotebookTabs tabs={TABS} active={activeTab} onTabClick={handleTabClick} />
      <MobileChatFab notebookId={id} />
    </div>
  )
}
