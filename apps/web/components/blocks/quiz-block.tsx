"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  HelpCircleIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

import type { QuizQuestion } from "@workspace/types"

type QuizBlockProps = {
  questions: QuizQuestion[]
  className?: string
}

type AnswerState = { selected: string | null; checked: boolean }

export function QuizBlock({ questions, className }: QuizBlockProps) {
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({})

  function update(i: number, patch: Partial<AnswerState>) {
    setAnswers((prev) => ({
      ...prev,
      [i]: { selected: null, checked: false, ...prev[i], ...patch },
    }))
  }

  return (
    <Card className={cn("space-y-5 p-5", className)}>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} className="size-3.5" />
        Quiz · {questions.length} question{questions.length === 1 ? "" : "s"}
      </div>

      <ol className="space-y-6">
        {questions.map((q, i) => {
          const state = answers[i] ?? { selected: null, checked: false }
          const correct = state.selected === q.correctAnswer
          return (
            <li key={i} className="space-y-3">
              <p className="text-sm font-medium">
                {i + 1}. {q.question}
              </p>
              <div className="grid gap-2">
                {q.options.map((opt) => {
                  const isSelected = state.selected === opt
                  const showCorrect = state.checked && opt === q.correctAnswer
                  const showWrong = state.checked && isSelected && !correct
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={state.checked}
                      onClick={() => update(i, { selected: opt })}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-3 py-2 text-start text-sm transition",
                        "hover:border-foreground/30",
                        isSelected && !state.checked && "border-foreground/40 bg-muted",
                        showCorrect && "border-foreground bg-foreground/10",
                        showWrong && "border-destructive/50 bg-destructive/10",
                        state.checked && "cursor-default",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border text-xs",
                          isSelected && !state.checked && "border-foreground bg-foreground text-background",
                          showCorrect && "border-foreground bg-foreground text-background",
                          showWrong && "border-destructive bg-destructive text-white",
                        )}
                      >
                        {showCorrect ? (
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-3" />
                        ) : showWrong ? (
                          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />
                        ) : null}
                      </span>
                      <span className="flex-1">{opt}</span>
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-3">
                {!state.checked ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!state.selected}
                    onClick={() => update(i, { checked: true })}
                  >
                    Check answer
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => update(i, { selected: null, checked: false })}
                  >
                    Try again
                  </Button>
                )}
                {state.checked && (
                  <span
                    className={cn(
                      "text-xs font-medium",
                      correct ? "text-foreground" : "text-destructive",
                    )}
                  >
                    {correct ? "Correct" : `Answer: ${q.correctAnswer}`}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
