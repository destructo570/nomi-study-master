"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
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

import {
  useDeleteFlashcard,
  useUpdateFlashcard,
} from "@/lib/hooks/use-flashcards"
import type { Flashcard } from "@workspace/types"

type Props = {
  notebookId: string
  cards: Flashcard[]
  onBack: () => void
}

export function ManageFlashcardsSection({ notebookId, cards, onBack }: Props) {
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
            Manage flashcards
          </h2>
          <p className="text-xs text-muted-foreground">
            Edit or delete cards in this notebook.
          </p>
        </div>
      </div>

      {cards.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
          No flashcards yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {cards.map((c, i) => (
            <ManageRow
              key={c.id}
              index={i + 1}
              card={c}
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
  card,
  notebookId,
  onDirtyChange,
}: {
  index: number
  card: Flashcard
  notebookId: string
  onDirtyChange: (id: string, dirty: boolean) => void
}) {
  const [editing, setEditing] = useState(false)
  const [question, setQuestion] = useState(card.question)
  const [answer, setAnswer] = useState(card.answer)
  const [hint, setHint] = useState(card.hint ?? "")
  const update = useUpdateFlashcard(notebookId)
  const remove = useDeleteFlashcard(notebookId)

  useEffect(() => {
    if (!editing) {
      setQuestion(card.question)
      setAnswer(card.answer)
      setHint(card.hint ?? "")
    }
  }, [card.question, card.answer, card.hint, editing])

  const dirty = useMemo(
    () =>
      editing &&
      (question !== card.question ||
        answer !== card.answer ||
        hint !== (card.hint ?? "")),
    [editing, question, answer, hint, card.question, card.answer, card.hint],
  )

  useEffect(() => {
    onDirtyChange(card.id, dirty)
    return () => onDirtyChange(card.id, false)
  }, [card.id, dirty, onDirtyChange])

  async function save() {
    const q = question.trim()
    const a = answer.trim()
    const h = hint.trim()
    if (!q || !a) {
      toast.error("Term and meaning are required.")
      return
    }
    const nextHint = h.length > 0 ? h : null
    if (
      q === card.question &&
      a === card.answer &&
      nextHint === (card.hint ?? null)
    ) {
      setEditing(false)
      return
    }
    try {
      await update.mutateAsync({
        id: card.id,
        question: q,
        answer: a,
        hint: nextHint,
      })
      setEditing(false)
    } catch {
      toast.error("Failed to save flashcard.")
    }
  }

  function cancel() {
    setQuestion(card.question)
    setAnswer(card.answer)
    setHint(card.hint ?? "")
    setEditing(false)
  }

  async function onDelete() {
    try {
      await remove.mutateAsync(card.id)
    } catch {
      toast.error("Failed to delete flashcard.")
    }
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
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Term"
                disabled={update.isPending}
              />
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Meaning"
                rows={2}
                disabled={update.isPending}
              />
              <Input
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="Hint (optional)"
                disabled={update.isPending}
              />
            </>
          ) : (
            <>
              <p className="text-sm font-medium leading-5 text-foreground">
                {card.question}
              </p>
              <p className="text-sm leading-5 text-muted-foreground">
                {card.answer}
              </p>
              {card.hint && (
                <p className="text-xs italic leading-5 text-muted-foreground/80">
                  Hint: {card.hint}
                </p>
              )}
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
