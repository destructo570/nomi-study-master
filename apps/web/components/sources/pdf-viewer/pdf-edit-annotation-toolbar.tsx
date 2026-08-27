"use client"

import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  Cancel01Icon,
  Comment01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

import type { Annotation, AnnotationColor } from "@workspace/types"

import { PdfColorPicker } from "./pdf-color-picker"
import { COLOR_STYLES } from "./types"

type PdfEditAnnotationToolbarProps = {
  annotation: Annotation
  anchor: { top: number; left: number }
  onColor: (color: AnnotationColor) => void
  onCommentSave: (comment: string | null) => void
  onDelete: () => void
  onClose: () => void
}

export function PdfEditAnnotationToolbar({
  annotation,
  anchor,
  onColor,
  onCommentSave,
  onDelete,
  onClose,
}: PdfEditAnnotationToolbarProps) {
  const [showComment, setShowComment] = useState(false)
  const [draft, setDraft] = useState(annotation.comment ?? "")
  const [colorOpen, setColorOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setDraft(annotation.comment ?? "")
  }, [annotation.comment])

  useEffect(() => {
    if (showComment) inputRef.current?.focus()
  }, [showComment])

  function commitComment() {
    const next = draft.trim()
    const prev = annotation.comment ?? ""
    if (next === prev) {
      setShowComment(false)
      return
    }
    onCommentSave(next.length === 0 ? null : next)
    setShowComment(false)
  }

  return (
    <div
      data-pdf-floating
      style={{
        position: "fixed",
        top: anchor.top,
        left: anchor.left,
        transform: "translate(-50%, 6px)",
      }}
      className="z-50 flex flex-col gap-1.5 rounded-xl bg-background p-1.5 shadow-lg ring-1 ring-foreground/10"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1">
        <Popover open={colorOpen} onOpenChange={setColorOpen}>
          <PopoverTrigger
            render={
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1 rounded-lg px-2"
                aria-label="Highlight color"
              >
                <span
                  className={cn(
                    "size-4 rounded-full ring-1 ring-foreground/10",
                    COLOR_STYLES[annotation.color]?.dot,
                  )}
                />
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  strokeWidth={2}
                  className="size-3"
                />
              </Button>
            }
          />
          <PopoverContent
            align="start"
            sideOffset={6}
            className="w-auto rounded-2xl p-2"
          >
            <PdfColorPicker
              current={annotation.color}
              onSelect={(c) => {
                onColor(c)
                setColorOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
        <span className="h-5 w-px bg-border" />
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1.5 rounded-lg px-2 text-xs"
          onClick={() => setShowComment((v) => !v)}
        >
          <HugeiconsIcon
            icon={Comment01Icon}
            strokeWidth={2}
            className="size-4"
          />
          Comment
        </Button>
        <span className="h-5 w-px bg-border" />
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1.5 rounded-lg px-2 text-xs text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
          Delete
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          className="ml-1"
          onClick={onClose}
          aria-label="Close"
        >
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3.5" />
        </Button>
      </div>
      {showComment && (
        <div className="px-1">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitComment}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                commitComment()
              } else if (e.key === "Escape") {
                e.preventDefault()
                setDraft(annotation.comment ?? "")
                setShowComment(false)
              }
            }}
            placeholder="Add a comment…"
            className="w-64 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-foreground/40"
          />
        </div>
      )}
    </div>
  )
}
