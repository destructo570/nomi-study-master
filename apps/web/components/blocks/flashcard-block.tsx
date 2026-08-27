"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon, FlashIcon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

import type { FlashcardCard } from "@workspace/types"

type FlashcardBlockProps = {
  cards: FlashcardCard[]
  className?: string
}

export function FlashcardBlock({ cards, className }: FlashcardBlockProps) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const card = cards[index]

  if (!card) return null

  function go(delta: number) {
    setIndex((i) => (i + delta + cards.length) % cards.length)
    setFlipped(false)
    setShowHint(false)
  }

  return (
    <Card className={cn("space-y-4 p-5", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <HugeiconsIcon icon={FlashIcon} strokeWidth={2} className="size-3.5" />
          Flashcards · {index + 1} / {cards.length}
        </div>
        <div className="flex gap-1">
          <Button size="icon-sm" variant="ghost" onClick={() => go(-1)} aria-label="Previous">
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => go(1)} aria-label="Next">
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
          </Button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-32 w-full items-center justify-center rounded-xl bg-muted/60 p-6 text-center text-base transition hover:bg-muted"
      >
        <span>{flipped ? card.answer : card.question}</span>
      </button>

      {!flipped && card.hint && (
        showHint ? (
          <p className="text-center text-xs italic text-muted-foreground">
            Hint: {card.hint}
          </p>
        ) : (
          <div className="flex justify-center">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowHint(true)}
              className="text-xs"
            >
              Show hint
            </Button>
          </div>
        )
      )}

      <p className="text-center text-xs text-muted-foreground">
        Click to {flipped ? "see question" : "reveal answer"}
      </p>
    </Card>
  )
}
