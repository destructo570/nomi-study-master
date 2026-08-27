"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Delete02Icon,
  Edit02Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"

import { useDeleteQuiz, useUpdateQuiz } from "@/lib/hooks/use-quizzes"
import type { Quiz } from "@workspace/types"

type Props = {
  notebookId: string
  quizzes: Quiz[]
  onBack: () => void
}

export function ManageQuizzesSection({ notebookId, quizzes, onBack }: Props) {
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(() => new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)

  const setDirty = useCallback((id: string, dirty: boolean) => {
    setDirtyIds((prev) => {
      const has = prev.has(id)
      if (dirty === has) return prev
      const next = new Set(prev)
      if (dirty) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const hasDirty = dirtyIds.size > 0

  function handleBack() {
    if (hasDirty) setConfirmOpen(true)
    else onBack()
  }

  function discardAndLeave() {
    setDirtyIds(new Set())
    setConfirmOpen(false)
    onBack()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Button type="button" size="sm" variant="ghost" onClick={handleBack}>
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            strokeWidth={2}
            className="size-4"
          />
          Go back
        </Button>
        <div className="text-right">
          <h2 className="text-lg font-semibold tracking-tight">
            Manage quizzes
          </h2>
          <p className="text-xs text-muted-foreground">
            Edit or delete quiz questions in this notebook.
          </p>
        </div>
      </div>

      {quizzes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
          No quizzes yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {quizzes.map((q, i) => (
            <ManageRow
              key={q.id}
              index={i + 1}
              quiz={q}
              notebookId={notebookId}
              onDirtyChange={setDirty}
            />
          ))}
        </ul>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>
              You have edits in progress that haven&apos;t been saved. Leaving
              now will discard them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
            >
              Keep editing
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={discardAndLeave}
            >
              Discard & go back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ManageRow({
  index,
  quiz,
  notebookId,
  onDirtyChange,
}: {
  index: number
  quiz: Quiz
  notebookId: string
  onDirtyChange: (id: string, dirty: boolean) => void
}) {
  const [editing, setEditing] = useState(false)
  const [question, setQuestion] = useState(quiz.question)
  const [options, setOptions] = useState<string[]>(quiz.options)
  const [correctIndex, setCorrectIndex] = useState<number>(() =>
    Math.max(0, quiz.options.indexOf(quiz.correctAnswer)),
  )
  const update = useUpdateQuiz(notebookId)
  const remove = useDeleteQuiz(notebookId)

  useEffect(() => {
    if (!editing) {
      setQuestion(quiz.question)
      setOptions(quiz.options)
      setCorrectIndex(Math.max(0, quiz.options.indexOf(quiz.correctAnswer)))
    }
  }, [quiz.question, quiz.options, quiz.correctAnswer, editing])

  const dirty = useMemo(() => {
    if (!editing) return false
    if (question !== quiz.question) return true
    if (options.length !== quiz.options.length) return true
    for (let i = 0; i < options.length; i++) {
      if (options[i] !== quiz.options[i]) return true
    }
    if (options[correctIndex] !== quiz.correctAnswer) return true
    return false
  }, [editing, question, options, correctIndex, quiz])

  useEffect(() => {
    onDirtyChange(quiz.id, dirty)
    return () => onDirtyChange(quiz.id, false)
  }, [quiz.id, dirty, onDirtyChange])

  async function save() {
    const q = question.trim()
    const trimmed = options.map((o) => o.trim())
    if (!q) {
      toast.error("Question is required.")
      return
    }
    if (trimmed.length < 2 || trimmed.some((o) => !o)) {
      toast.error("Provide at least two non-empty options.")
      return
    }
    const correct = trimmed[correctIndex]
    if (!correct) {
      toast.error("Select a correct answer.")
      return
    }
    const sameOptions =
      trimmed.length === quiz.options.length &&
      trimmed.every((o, i) => o === quiz.options[i])
    if (
      q === quiz.question &&
      sameOptions &&
      correct === quiz.correctAnswer
    ) {
      setEditing(false)
      return
    }
    try {
      await update.mutateAsync({
        id: quiz.id,
        question: q,
        options: trimmed,
        correctAnswer: correct,
      })
      setEditing(false)
    } catch {
      toast.error("Failed to save quiz.")
    }
  }

  function cancel() {
    setQuestion(quiz.question)
    setOptions(quiz.options)
    setCorrectIndex(Math.max(0, quiz.options.indexOf(quiz.correctAnswer)))
    setEditing(false)
  }

  async function onDelete() {
    try {
      await remove.mutateAsync(quiz.id)
    } catch {
      toast.error("Failed to delete quiz.")
    }
  }

  function updateOption(i: number, value: string) {
    setOptions((prev) => {
      const next = [...prev]
      next[i] = value
      return next
    })
  }

  function addOption() {
    setOptions((prev) => [...prev, ""])
  }

  function removeOption(i: number) {
    if (options.length <= 2) {
      toast.error("At least two options are required.")
      return
    }
    setOptions((prev) => prev.filter((_, idx) => idx !== i))
    setCorrectIndex((prev) => {
      if (prev === i) return 0
      if (prev > i) return prev - 1
      return prev
    })
  }

  return (
    <li
      className={cn(
        "rounded-2xl border border-border bg-background p-3",
        editing && "border-primary/30 ring-1 ring-primary/10",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-1.5 w-6 shrink-0 text-center text-[11px] font-medium text-muted-foreground">
          {index}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {editing ? (
            <>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Question"
                rows={2}
                disabled={update.isPending}
              />
              <div className="flex flex-col gap-1.5">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={correctIndex === i}
                      onClick={() => setCorrectIndex(i)}
                      disabled={update.isPending}
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border border-border transition-colors",
                        correctIndex === i &&
                          "border-foreground bg-foreground/10",
                      )}
                      aria-label={
                        correctIndex === i
                          ? "Correct answer"
                          : "Mark as correct"
                      }
                    >
                      {correctIndex === i ? (
                        <span className="size-2 rounded-full bg-foreground" />
                      ) : null}
                    </button>
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      disabled={update.isPending}
                    />
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => removeOption(i)}
                      disabled={update.isPending || options.length <= 2}
                      aria-label="Remove option"
                    >
                      <HugeiconsIcon
                        icon={Delete02Icon}
                        strokeWidth={2}
                        className="size-4"
                      />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={addOption}
                  disabled={update.isPending}
                  className="self-start"
                >
                  <HugeiconsIcon
                    icon={Add01Icon}
                    strokeWidth={2}
                    className="size-4"
                  />
                  Add option
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-medium leading-5 text-foreground">
                {quiz.question}
              </p>
              <ul className="flex flex-col gap-1">
                {quiz.options.map((opt) => {
                  const correct = opt === quiz.correctAnswer
                  return (
                    <li
                      key={opt}
                      className={cn(
                        "flex items-center gap-2 text-sm leading-5",
                        correct
                          ? "text-foreground font-medium"
                          : "text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-full border border-border",
                          correct && "border-foreground bg-foreground/10",
                        )}
                      >
                        {correct ? (
                          <span className="size-1.5 rounded-full bg-foreground" />
                        ) : null}
                      </span>
                      <span>{opt}</span>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {editing ? (
            <>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={save}
                disabled={update.isPending}
                aria-label="Save"
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  strokeWidth={2}
                  className="size-4"
                />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={cancel}
                disabled={update.isPending}
                aria-label="Cancel"
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  strokeWidth={2}
                  className="size-4"
                />
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => setEditing(true)}
                aria-label="Edit"
              >
                <HugeiconsIcon
                  icon={Edit02Icon}
                  strokeWidth={2}
                  className="size-4"
                />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={onDelete}
                disabled={remove.isPending}
                aria-label="Delete"
                className="text-destructive hover:text-destructive"
              >
                <HugeiconsIcon
                  icon={Delete02Icon}
                  strokeWidth={2}
                  className="size-4"
                />
              </Button>
            </>
          )}
        </div>
      </div>
    </li>
  )
}
