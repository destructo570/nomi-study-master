"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, RefreshIcon } from "@hugeicons/core-free-icons"

import {
  NOTEBOOK_COVERS,
  notebookCoverImagePath,
  randomNotebookCover,
} from "@workspace/types"

type CoverPickerProps = {
  value: string
  onChange: (cover: string) => void
  showShuffle?: boolean
}

export function CoverPicker({
  value,
  onChange,
  showShuffle = true,
}: CoverPickerProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Cover
        </span>
        {showShuffle && (
          <button
            type="button"
            onClick={() => onChange(randomNotebookCover())}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <HugeiconsIcon
              icon={RefreshIcon}
              strokeWidth={2}
              className="size-3.5"
            />
            Shuffle
          </button>
        )}
      </div>
      <div className="grid max-h-56 grid-cols-5 gap-2 overflow-y-auto rounded-xl border border-border bg-background p-2">
        {NOTEBOOK_COVERS.map((cover) => {
          const selected = cover === value
          return (
            <button
              key={cover}
              type="button"
              onClick={() => onChange(cover)}
              className={
                selected
                  ? "relative aspect-[16/9] overflow-hidden rounded-md ring-2 ring-primary ring-offset-1"
                  : "relative aspect-[16/9] overflow-hidden rounded-md ring-1 ring-border transition hover:ring-foreground/30"
              }
              aria-label={`Choose cover ${cover}`}
              aria-pressed={selected}
            >
              <img
                src={notebookCoverImagePath(cover)}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
              {selected && (
                <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    strokeWidth={2.5}
                    className="size-3"
                  />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
