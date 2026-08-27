"use client"

import { use, useEffect, useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  HelpSquareIcon,
  ListSettingIcon,
  MagicWand01Icon,
  ReloadIcon,
  ShuffleIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import {
  type LanguageCode,
  normalizeLanguage,
} from "@workspace/types/language"

import { GenerateQuizzesDialog } from "@/components/notebook/generate-quizzes-dialog"
import {
  ArtifactLanguageSwitcher,
  pickInitialLanguage,
} from "@/components/notebook/artifact-language-switcher"
import {
  NoSourceTooltip,
  useHasNoSource,
} from "@/components/notebook/generate-button-guard"
import { ManageQuizzesSection } from "@/components/notebook/manage-quizzes"
import { useQuizzes } from "@/lib/hooks/use-quizzes"
import { useTranslateQuizzes } from "@/lib/hooks/use-generate"
import { useDefaultLanguage } from "@/lib/hooks/use-me"
import type { Quiz } from "@workspace/types"

export default function NotebookQuizzesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const quizzesQuery = useQuizzes(id)
  const allItems = quizzesQuery.data ?? []
  const isLoading = quizzesQuery.isPending
  const [genOpen, setGenOpen] = useState(false)
  const [view, setView] = useState<"play" | "manage">("play")
  const noSource = useHasNoSource(id)
  const userLanguage = useDefaultLanguage()
  const translate = useTranslateQuizzes(id)

  const availableLanguages = useMemo<LanguageCode[]>(() => {
    const seen = new Set<LanguageCode>()
    const out: LanguageCode[] = []
    for (const q of allItems) {
      const lc = normalizeLanguage(q.language)
      if (!seen.has(lc)) {
        seen.add(lc)
        out.push(lc)
      }
    }
    return out
  }, [allItems])

  const [language, setLanguage] = useState<LanguageCode | null>(null)
  useEffect(() => {
    if (language && availableLanguages.includes(language)) return
    setLanguage(pickInitialLanguage(availableLanguages, userLanguage))
  }, [availableLanguages, language, userLanguage])

  const items = useMemo(() => {
    if (!language) return allItems
    return allItems.filter((q) => normalizeLanguage(q.language) === language)
  }, [allItems, language])

  async function handleTranslate(target: LanguageCode) {
    try {
      await translate.mutateAsync({ targetLanguage: target })
      setLanguage(target)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to translate quizzes"
      toast.error(msg)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-8 pt-8 pb-16">
      {view === "manage" ? (
        <ManageQuizzesSection
          notebookId={id}
          quizzes={items}
          onBack={() => setView("play")}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Quizzes</h1>
              <p className="hidden text-sm text-muted-foreground sm:block">
                Short multiple-choice questions to check recall.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {allItems.length > 0 && language && (
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
                disabled={items.length === 0}
              >
                <HugeiconsIcon
                  icon={ListSettingIcon}
                  strokeWidth={2}
                  className="size-4"
                />
                Manage quizzes
              </Button>
            </div>
          </div>

          {isLoading ? (
            <QuizzesSkeleton />
          ) : items.length === 0 ? (
            <EmptyState
              notebookId={id}
              noSource={noSource}
              onGenerate={() => setGenOpen(true)}
            />
          ) : (
            <QuizRunner quizzes={items} />
          )}
        </>
      )}

      <GenerateQuizzesDialog
        open={genOpen}
        onOpenChange={setGenOpen}
        notebookId={id}
      />
    </div>
  )
}

function QuizzesSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24 rounded-md" />
          <Skeleton className="h-3 w-8 rounded-md" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <div className="space-y-3 rounded-2xl border border-border bg-background p-6">
        <Skeleton className="h-5 w-3/4 rounded-md" />
        <Skeleton className="h-5 w-2/3 rounded-md" />
        <div className="space-y-2 pt-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
  )
}

type Answer = { picked: string; correct: boolean }

function shuffleArray<T>(arr: T[]): T[] {
  const next = [...arr]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j]!, next[i]!]
  }
  return next
}

function QuizRunner({ quizzes }: { quizzes: Quiz[] }) {
  const [order, setOrder] = useState<string[]>(() => quizzes.map((q) => q.id))
  const [pos, setPos] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [finished, setFinished] = useState(false)

  const ids = useMemo(() => quizzes.map((q) => q.id).join("|"), [quizzes])

  useEffect(() => {
    setOrder(quizzes.map((q) => q.id))
    setPos(0)
    setPicked(null)
    setAnswers([])
    setFinished(false)
  }, [ids])

  const byId = useMemo(() => {
    const map = new Map<string, Quiz>()
    for (const q of quizzes) map.set(q.id, q)
    return map
  }, [quizzes])

  const orderedQuizzes = useMemo(
    () => order.map((id) => byId.get(id)).filter((q): q is Quiz => !!q),
    [order, byId],
  )

  if (finished) {
    return (
      <Summary
        quizzes={orderedQuizzes}
        answers={answers}
        onRetry={() => {
          setOrder(shuffleArray(quizzes.map((q) => q.id)))
          setPos(0)
          setPicked(null)
          setAnswers([])
          setFinished(false)
        }}
      />
    )
  }

  const current = orderedQuizzes[pos]
  if (!current) return null

  const total = orderedQuizzes.length
  const isLast = pos === total - 1
  const progress = Math.round(((answers.length + (picked ? 1 : 0)) / total) * 100)

  function onPick(opt: string) {
    if (picked !== null) return
    setPicked(opt)
  }

  function onNext() {
    if (picked === null || !current) return
    const answer: Answer = {
      picked,
      correct: picked === current.correctAnswer,
    }
    setAnswers((a) => [...a, answer])
    setPicked(null)
    if (isLast) {
      setFinished(true)
    } else {
      setPos((p) => p + 1)
    }
  }

  function onShuffle() {
    setOrder(shuffleArray(quizzes.map((q) => q.id)))
    setPos(0)
    setPicked(null)
    setAnswers([])
    setFinished(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Question{" "}
            <span className="font-medium text-foreground">{pos + 1}</span> of{" "}
            {total}
          </span>
          <span className="tabular-nums">{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background p-6">
        <p className="mb-4 text-base font-medium leading-7">
          {current.question}
        </p>
        <div className="flex flex-col gap-2">
          {current.options.map((opt) => {
            const isPicked = picked === opt
            const isCorrect = opt === current.correctAnswer
            const state =
              picked === null
                ? "idle"
                : isPicked && isCorrect
                  ? "correct"
                  : isPicked
                    ? "wrong"
                    : isCorrect
                      ? "reveal"
                      : "idle"
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onPick(opt)}
                disabled={picked !== null}
                className={cn(
                  "flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-left text-sm transition-colors",
                  state === "idle" && "hover:bg-accent/60",
                  state === "correct" &&
                    "border-foreground bg-foreground/10",
                  state === "wrong" && "border-destructive/50 bg-destructive/10",
                  state === "reveal" &&
                    "border-foreground/40 bg-foreground/5",
                )}
              >
                <span>{opt}</span>
                {state === "correct" || state === "reveal" ? (
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    strokeWidth={2}
                    className="size-4 text-foreground"
                  />
                ) : state === "wrong" ? (
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    strokeWidth={2}
                    className="size-4 text-destructive"
                  />
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onShuffle}
          disabled={total <= 1}
        >
          <HugeiconsIcon
            icon={ShuffleIcon}
            strokeWidth={2}
            className="size-4"
          />
          Shuffle
        </Button>
        <Button type="button" onClick={onNext} disabled={picked === null}>
          {isLast ? "Finish" : "Next"}
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="size-4"
          />
        </Button>
      </div>
    </div>
  )
}

function Summary({
  quizzes,
  answers,
  onRetry,
}: {
  quizzes: Quiz[]
  answers: Answer[]
  onRetry: () => void
}) {
  const correct = answers.filter((a) => a.correct).length
  const total = quizzes.length
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-background px-6 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            strokeWidth={2}
            className="size-6"
          />
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          Quiz complete
        </h2>
        <p className="text-sm text-muted-foreground">
          You got{" "}
          <span className="font-medium text-foreground">
            {correct} / {total}
          </span>{" "}
          correct ({pct}%).
        </p>
        <Button type="button" size="sm" onClick={onRetry} className="mt-2">
          <HugeiconsIcon icon={ReloadIcon} strokeWidth={2} className="size-4" />
          Try again
        </Button>
      </div>

      <ol className="flex flex-col gap-3">
        {quizzes.map((q, i) => {
          const a = answers[i]
          const correctPick = a?.correct ?? false
          return (
            <li
              key={q.id}
              className="rounded-2xl border border-border bg-background p-4"
            >
              <div className="mb-2 flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-xs font-medium text-muted-foreground">
                  {i + 1}.
                </span>
                <p className="flex-1 text-sm font-medium leading-6">
                  {q.question}
                </p>
                {a ? (
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full",
                      correctPick
                        ? "bg-foreground/10 text-foreground"
                        : "bg-destructive/10 text-destructive",
                    )}
                    aria-label={correctPick ? "Correct" : "Incorrect"}
                  >
                    <HugeiconsIcon
                      icon={correctPick ? CheckmarkCircle02Icon : Cancel01Icon}
                      strokeWidth={2}
                      className="size-3.5"
                    />
                  </span>
                ) : null}
              </div>
              <ul className="ml-5 flex flex-col gap-1 text-sm">
                {q.options.map((opt) => {
                  const isCorrect = opt === q.correctAnswer
                  const isPicked = a?.picked === opt
                  return (
                    <li
                      key={opt}
                      className={cn(
                        "flex items-center gap-2",
                        isCorrect
                          ? "text-foreground font-medium"
                          : isPicked
                            ? "text-destructive"
                            : "text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-full border border-border",
                          isCorrect && "border-foreground bg-foreground/10",
                          isPicked &&
                            !isCorrect &&
                            "border-destructive/60 bg-destructive/10",
                        )}
                      >
                        {isCorrect ? (
                          <span className="size-1.5 rounded-full bg-foreground" />
                        ) : isPicked ? (
                          <span className="size-1.5 rounded-full bg-destructive" />
                        ) : null}
                      </span>
                      <span>{opt}</span>
                      {isPicked ? (
                        <span className="text-[11px] uppercase tracking-wide opacity-70">
                          your answer
                        </span>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ol>
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
        <HugeiconsIcon
          icon={HelpSquareIcon}
          strokeWidth={2}
          className="size-6"
        />
      </span>
      <p className="text-sm text-muted-foreground">
        No quizzes yet. Generate some with AI.
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
          Generate quiz
        </Button>
      </NoSourceTooltip>
    </div>
  )
}
