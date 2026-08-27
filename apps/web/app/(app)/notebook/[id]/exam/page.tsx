"use client"

import { use, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  MagicWand01Icon,
  TaskDone01Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { useExam } from "@/lib/hooks/use-exam"

export default function NotebookExamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const examQuery = useExam(id)
  const items = examQuery.data ?? []

  return (
    <div className="mx-auto max-w-4xl px-8 pt-8 pb-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Exam</h1>
          <p className="text-sm text-muted-foreground">
            Long-form questions that cover the whole notebook.
          </p>
        </div>
        <Button size="sm" disabled title="Coming soon">
          <HugeiconsIcon
            icon={MagicWand01Icon}
            strokeWidth={2}
            className="size-4"
          />
          Generate with AI
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <ol className="space-y-3">
          {items.map((e, i) => (
            <ExamItem
              key={e.id}
              index={i + 1}
              question={e.question}
              answer={e.answer}
              explanation={e.explanation ?? null}
            />
          ))}
        </ol>
      )}
    </div>
  )
}

function ExamItem({
  index,
  question,
  answer,
  explanation,
}: {
  index: number
  question: string
  answer: string
  explanation: string | null
}) {
  const [open, setOpen] = useState(false)
  return (
    <li className="rounded-2xl border border-border bg-background">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left"
      >
        <p className="text-sm font-medium leading-6">
          <span className="mr-2 text-muted-foreground">{index}.</span>
          {question}
        </p>
        <HugeiconsIcon
          icon={open ? ArrowUp01Icon : ArrowDown01Icon}
          strokeWidth={2}
          className="mt-1 size-4 shrink-0 text-muted-foreground"
        />
      </button>
      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-border px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Answer
            </p>
            <p className="mt-1 text-sm leading-6 text-foreground/90">{answer}</p>
            {explanation ? (
              <>
                <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
                  Explanation
                </p>
                <p className="mt-1 text-sm leading-6 text-foreground/80">
                  {explanation}
                </p>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <HugeiconsIcon
          icon={TaskDone01Icon}
          strokeWidth={2}
          className="size-6"
        />
      </span>
      <p className="text-sm text-muted-foreground">
        No exam questions yet. Generation with AI is coming soon.
      </p>
    </div>
  )
}
