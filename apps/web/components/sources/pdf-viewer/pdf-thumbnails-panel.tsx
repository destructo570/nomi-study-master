"use client"

import { Document, Thumbnail } from "react-pdf"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type PdfThumbnailsPanelProps = {
  src: string
  numPages: number
  currentPage: number
  onClose: () => void
  onJumpToPage: (page: number) => void
}

export function PdfThumbnailsPanel({
  src,
  numPages,
  currentPage,
  onClose,
  onJumpToPage,
}: PdfThumbnailsPanelProps) {
  return (
    <div className="flex w-56 shrink-0 flex-col border-r border-border bg-background">
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-sm font-medium">Pages</span>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={onClose}
          aria-label="Close"
        >
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <Document file={src} loading={null} error={null}>
          <div className="grid grid-cols-1 gap-3">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => onJumpToPage(p)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg p-1.5 transition-colors hover:bg-muted",
                  p === currentPage && "bg-muted",
                )}
              >
                <div
                  className={cn(
                    "overflow-hidden rounded-md bg-white ring-1 ring-border/60",
                    p === currentPage && "ring-2 ring-foreground",
                  )}
                >
                  <Thumbnail pageNumber={p} width={160} />
                </div>
                <span
                  className={cn(
                    "text-[11px] tabular-nums text-muted-foreground",
                    p === currentPage && "font-medium text-foreground",
                  )}
                >
                  {p}
                </span>
              </button>
            ))}
          </div>
        </Document>
      </div>
    </div>
  )
}
