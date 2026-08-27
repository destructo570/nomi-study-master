"use client"

import {
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cards01Icon,
  ListSettingIcon,
  MagicWand01Icon,
  ReloadIcon,
  ShuffleIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"
import {
  type LanguageCode,
  normalizeLanguage,
} from "@workspace/types/language"

import { GenerateFlashcardsDialog } from "@/components/notebook/generate-flashcards-dialog"
import {
  ArtifactLanguageSwitcher,
  pickInitialLanguage,
} from "@/components/notebook/artifact-language-switcher"
import {
  NoSourceTooltip,
  useHasNoSource,
} from "@/components/notebook/generate-button-guard"
import { ManageFlashcardsSection } from "@/components/notebook/manage-flashcards"
import { useFlashcards } from "@/lib/hooks/use-flashcards"
import { useTranslateFlashcards } from "@/lib/hooks/use-generate"
import { useDefaultLanguage } from "@/lib/hooks/use-me"
import type { Flashcard } from "@workspace/types"

type Mode = "spaced" | "quick"

function shuffleIds(ids: string[]): string[] {
  const next = [...ids]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j]!, next[i]!]
  }
  return next
}

export default function NotebookFlashcardsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const flashcardsQuery = useFlashcards(id)
  const allCards = flashcardsQuery.data ?? []
  const isLoading = flashcardsQuery.isPending
  const [genOpen, setGenOpen] = useState(false)
  const [view, setView] = useState<"study" | "manage">("study")
  const [mode, setMode] = useState<Mode>("spaced")
  const noSource = useHasNoSource(id)
  const userLanguage = useDefaultLanguage()
  const translate = useTranslateFlashcards(id)

  const availableLanguages = useMemo<LanguageCode[]>(() => {
    const seen = new Set<LanguageCode>()
    const out: LanguageCode[] = []
    for (const c of allCards) {
      const lc = normalizeLanguage(c.language)
      if (!seen.has(lc)) {
        seen.add(lc)
        out.push(lc)
      }
    }
    return out
  }, [allCards])

  const [language, setLanguage] = useState<LanguageCode | null>(null)
  useEffect(() => {
    if (language && availableLanguages.includes(language)) return
    setLanguage(pickInitialLanguage(availableLanguages, userLanguage))
  }, [availableLanguages, language, userLanguage])

  const cards = useMemo(() => {
    if (!language) return allCards
    return allCards.filter((c) => normalizeLanguage(c.language) === language)
  }, [allCards, language])

  async function handleTranslate(target: LanguageCode) {
    try {
      await translate.mutateAsync({ targetLanguage: target })
      setLanguage(target)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to translate flashcards"
      toast.error(msg)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-8 pt-8 pb-16">
      {view === "manage" ? (
        <ManageFlashcardsSection
          notebookId={id}
          cards={cards}
          onBack={() => setView("study")}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Flashcards
              </h1>
              <p className="hidden text-sm text-muted-foreground sm:block">
                Quick-recall cards drawn from this notebook.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {allCards.length > 0 && language && (
                <ArtifactLanguageSwitcher
                  value={language}
                  available={availableLanguages}
                  onSelect={setLanguage}
                  onTranslate={handleTranslate}
                  pending={translate.isPending}
                />
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setView("manage")}
                disabled={cards.length === 0}
              >
                <HugeiconsIcon
                  icon={ListSettingIcon}
                  strokeWidth={2}
                  className="size-4"
                />
                Manage flashcards
              </Button>
            </div>
          </div>

          {isLoading ? (
            <FlashcardsSkeleton />
          ) : cards.length === 0 ? (
            <EmptyState
              notebookId={id}
              noSource={noSource}
              onGenerate={() => setGenOpen(true)}
            />
          ) : (
            <Tabs
              value={mode}
              onValueChange={(v) => setMode(v as Mode)}
              className="gap-6"
            >
              <TabsList>
                <TabsTrigger value="spaced">Spaced repetition</TabsTrigger>
                <TabsTrigger value="quick">Quick review</TabsTrigger>
              </TabsList>

              <TabsContent value="spaced">
                <SpacedRepetitionMode cards={cards} />
              </TabsContent>
              <TabsContent value="quick">
                <QuickReviewMode cards={cards} />
              </TabsContent>
            </Tabs>
          )}
        </>
      )}

      <GenerateFlashcardsDialog
        open={genOpen}
        onOpenChange={setGenOpen}
        notebookId={id}
      />
    </div>
  )
}

function FlashcardsSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-32 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
      <Skeleton className="h-64 w-full max-w-2xl rounded-3xl sm:h-72" />
      <div className="flex items-center gap-6">
        <Skeleton className="size-9 rounded-md" />
        <Skeleton className="h-4 w-12 rounded-md" />
        <Skeleton className="size-9 rounded-md" />
        <Skeleton className="size-9 rounded-md" />
      </div>
    </div>
  )
}

function QuickReviewMode({ cards }: { cards: Flashcard[] }) {
  const [order, setOrder] = useState<string[]>(() => cards.map((c) => c.id))
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    setOrder((prev) => {
      const ids = cards.map((c) => c.id)
      const existing = prev.filter((id) => ids.includes(id))
      const added = ids.filter((id) => !prev.includes(id))
      return [...existing, ...added]
    })
  }, [cards])

  useEffect(() => {
    if (index >= order.length && order.length > 0) setIndex(0)
  }, [order.length, index])

  function shuffle() {
    setOrder((prev) => shuffleIds(prev))
    setIndex(0)
    setFlipped(false)
    setShowHint(false)
  }

  const byId = useMemo(() => {
    const map = new Map<string, Flashcard>()
    for (const c of cards) map.set(c.id, c)
    return map
  }, [cards])

  const current = order[index] ? byId.get(order[index]!) : undefined

  const go = useCallback(
    (delta: number) => {
      if (order.length === 0) return
      setFlipped(false)
      setShowHint(false)
      setIndex((i) => (i + delta + order.length) % order.length)
    },
    [order.length],
  )

  if (!current) return null

  return (
    <div className="flex flex-col items-center gap-6">
      <FlipCard
        question={current.question}
        answer={current.answer}
        hint={current.hint}
        flipped={flipped}
        showHint={showHint}
        onFlip={() => setFlipped((f) => !f)}
        onShowHint={() => setShowHint(true)}
      />

      <div className="flex items-center gap-6">
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => go(-1)}
          disabled={order.length <= 1}
          aria-label="Previous card"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            strokeWidth={2}
            className="size-4"
          />
        </Button>
        <span className="min-w-14 text-center text-sm tabular-nums text-muted-foreground">
          {index + 1}/{order.length}
        </span>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => go(1)}
          disabled={order.length <= 1}
          aria-label="Next card"
        >
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="size-4"
          />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={shuffle}
          disabled={order.length <= 1}
          aria-label="Shuffle cards"
        >
          <HugeiconsIcon
            icon={ShuffleIcon}
            strokeWidth={2}
            className="size-4"
          />
        </Button>
      </div>
    </div>
  )
}

type SrRating = "again" | "hard" | "good" | "easy"

const RATING_DELAY_MS: Record<SrRating, number> = {
  again: 60_000,
  hard: 8 * 60_000,
  good: 15 * 60_000,
  easy: 2 * 24 * 60 * 60_000,
}

const RATING_LABEL: Record<SrRating, string> = {
  again: "1 min",
  hard: "8 min",
  good: "15 min",
  easy: "2 days",
}

type SrQueueItem = { id: string; dueAt: number }

type SrState = {
  queue: SrQueueItem[]
  reviewed: number
  ended: boolean
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "now"
  const days = Math.floor(ms / 86_400_000)
  if (days >= 1) {
    const hours = Math.floor((ms % 86_400_000) / 3_600_000)
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`
  }
  const hours = Math.floor(ms / 3_600_000)
  if (hours >= 1) {
    const minutes = Math.floor((ms % 3_600_000) / 60_000)
    return `${hours}h ${minutes}m`
  }
  const minutes = Math.floor(ms / 60_000)
  const seconds = Math.floor((ms % 60_000) / 1000)
  if (minutes >= 1) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

function SpacedRepetitionMode({ cards }: { cards: Flashcard[] }) {
  const [state, setState] = useState<SrState>(() => ({
    queue: shuffleIds(cards.map((c) => c.id)).map((id) => ({ id, dueAt: 0 })),
    reviewed: 0,
    ended: false,
  }))
  const [flipped, setFlipped] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [nowTs, setNowTs] = useState(() => Date.now())

  useEffect(() => {
    setState((prev) => {
      const ids = new Set(cards.map((c) => c.id))
      const filtered = prev.queue.filter((item) => ids.has(item.id))
      const existing = new Set(filtered.map((item) => item.id))
      const newOnes = cards
        .filter((c) => !existing.has(c.id))
        .map((c) => ({ id: c.id, dueAt: 0 }))
      if (newOnes.length === 0 && filtered.length === prev.queue.length) {
        return prev
      }
      const queue = [...filtered, ...newOnes]
      queue.sort((a, b) => a.dueAt - b.dueAt)
      return { ...prev, queue }
    })
  }, [cards])

  useEffect(() => {
    if (state.queue.length === 0) return
    const next = state.queue[0]!.dueAt
    const wait = next - Date.now()
    if (wait <= 0) return
    const t = setTimeout(() => setNowTs(Date.now()), Math.min(wait, 1000))
    return () => clearTimeout(t)
  }, [state.queue, nowTs])

  const byId = useMemo(() => {
    const map = new Map<string, Flashcard>()
    for (const c of cards) map.set(c.id, c)
    return map
  }, [cards])

  const head = state.queue[0]
  const current = head && head.dueAt <= nowTs ? byId.get(head.id) : undefined

  function rate(rating: SrRating) {
    if (!head || head.dueAt > Date.now()) return
    setFlipped(false)
    setShowHint(false)
    const dueAt = Date.now() + RATING_DELAY_MS[rating]
    setState((prev) => {
      const rest = prev.queue.slice(1)
      const next = [...rest, { id: head.id, dueAt }]
      next.sort((a, b) => a.dueAt - b.dueAt)
      return { ...prev, queue: next, reviewed: prev.reviewed + 1 }
    })
  }

  function finishSession() {
    setFlipped(false)
    setShowHint(false)
    setState((prev) => ({ ...prev, ended: true }))
  }

  function restart() {
    setFlipped(false)
    setShowHint(false)
    setState({
      queue: shuffleIds(cards.map((c) => c.id)).map((id) => ({ id, dueAt: 0 })),
      reviewed: 0,
      ended: false,
    })
  }

  if (state.ended || state.queue.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <HugeiconsIcon
            icon={Cards01Icon}
            strokeWidth={2}
            className="size-6"
          />
        </span>
        <p className="text-sm text-muted-foreground">
          Session complete - {state.reviewed}{" "}
          {state.reviewed === 1 ? "card" : "cards"} reviewed.
        </p>
        <Button type="button" size="sm" onClick={restart}>
          <HugeiconsIcon icon={ReloadIcon} strokeWidth={2} className="size-4" />
          Start again
        </Button>
      </div>
    )
  }

  if (!current && head) {
    const waitMs = head.dueAt - nowTs
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
        <p className="text-sm text-muted-foreground">
          Next card due in{" "}
          <span className="font-medium text-foreground">
            {formatCountdown(waitMs)}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          Reviewed{" "}
          <span className="font-medium text-foreground">{state.reviewed}</span>
          {" · "}
          {state.queue.length} card{state.queue.length === 1 ? "" : "s"} in
          queue
        </p>
        <Button type="button" size="sm" variant="outline" onClick={finishSession}>
          Finish session
        </Button>
      </div>
    )
  }

  if (!current) return null

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
        <span>
          Reviewed{" "}
          <span className="font-medium text-foreground">{state.reviewed}</span>
        </span>
        <span>
          <span className="font-medium text-foreground">
            {state.queue.length}
          </span>{" "}
          in queue
        </span>
      </div>

      <FlipCard
        question={current.question}
        answer={current.answer}
        hint={current.hint}
        flipped={flipped}
        showHint={showHint}
        onFlip={() => setFlipped((f) => !f)}
        onShowHint={() => setShowHint(true)}
      />

      {flipped ? (
        <div className="grid w-full max-w-md grid-cols-4 gap-2">
          <SrButton
            label="Again"
            sublabel={RATING_LABEL.again}
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => rate("again")}
          />
          <SrButton
            label="Hard"
            sublabel={RATING_LABEL.hard}
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => rate("hard")}
          />
          <SrButton
            label="Good"
            sublabel={RATING_LABEL.good}
            className="border-foreground/40 text-foreground hover:bg-foreground/5"
            onClick={() => rate("good")}
          />
          <SrButton
            label="Easy"
            sublabel={RATING_LABEL.easy}
            className="border-foreground bg-foreground text-background hover:bg-foreground/90"
            onClick={() => rate("easy")}
          />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Click the card to reveal the answer.
        </p>
      )}
    </div>
  )
}

function SrButton({
  label,
  sublabel,
  className,
  onClick,
}: {
  label: string
  sublabel: string
  className?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 rounded-2xl border border-border bg-background px-3 py-2 text-sm font-medium transition-colors",
        className,
      )}
    >
      <span>{label}</span>
      <span className="text-[10px] font-normal opacity-70">{sublabel}</span>
    </button>
  )
}

function FlipCard({
  question,
  answer,
  hint,
  flipped,
  showHint,
  onFlip,
  onShowHint,
}: {
  question: string
  answer: string
  hint: string | null
  flipped: boolean
  showHint: boolean
  onFlip: () => void
  onShowHint: () => void
}) {
  const [renderedAnswer, setRenderedAnswer] = useState(answer)

  useLayoutEffect(() => {
    if (flipped) setRenderedAnswer(answer)
  }, [flipped, answer])

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-2">
      <button
        type="button"
        onClick={onFlip}
        aria-pressed={flipped}
        className="group w-full [perspective:1400px]"
      >
        <div
          className={cn(
            "relative h-64 w-full transition-transform duration-500 [transform-style:preserve-3d] sm:h-72",
            flipped && "[transform:rotateX(180deg)]",
          )}
        >
          <FlipFace label="Term" text={question} className="bg-background" />
          <FlipFace
            label="Meaning"
            text={renderedAnswer}
            className="bg-accent/40 [transform:rotateX(180deg)]"
          />
        </div>
      </button>
      {!flipped && hint && (
        showHint ? (
          <p className="text-center text-xs italic text-muted-foreground">
            Hint: {hint}
          </p>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onShowHint}
            className="text-xs"
          >
            Show hint
          </Button>
        )
      )}
    </div>
  )
}

function FlipFace({
  label,
  text,
  className,
}: {
  label: string
  text: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-border px-8 py-10 text-center [backface-visibility:hidden] [-webkit-backface-visibility:hidden]",
        className,
      )}
    >
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <p className="text-lg font-medium leading-7 text-foreground">{text}</p>
    </div>
  )
}

function EmptyState({
  notebookId,
  noSource,
  onGenerate,
}: {
  notebookId: string
  noSource: boolean
  onGenerate: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <HugeiconsIcon icon={Cards01Icon} strokeWidth={2} className="size-6" />
      </span>
      <p className="text-sm text-muted-foreground">
        No flashcards yet. Generate some with AI.
      </p>
      <NoSourceTooltip notebookId={notebookId}>
        <Button
          type="button"
          size="sm"
          onClick={onGenerate}
          disabled={noSource}
        >
          <HugeiconsIcon
            icon={MagicWand01Icon}
            strokeWidth={2}
            className="size-4"
          />
          Generate cards
        </Button>
      </NoSourceTooltip>
    </div>
  )
}
