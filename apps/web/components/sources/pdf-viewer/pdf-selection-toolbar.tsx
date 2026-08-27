"use client"

import type { AnnotationColor } from "@workspace/types"

import { PdfColorPicker } from "./pdf-color-picker"

type PdfSelectionToolbarProps = {
  anchor: { top: number; left: number }
  onSelect: (color: AnnotationColor) => void
}

export function PdfSelectionToolbar({
  anchor,
  onSelect,
}: PdfSelectionToolbarProps) {
  return (
    <div
      data-pdf-floating
      style={{
        position: "fixed",
        top: anchor.top,
        left: anchor.left,
        transform: "translateX(-50%)",
      }}
      className="z-50 flex items-center gap-2 rounded-full bg-background px-3 py-1.5 shadow-lg ring-1 ring-foreground/10"
      onMouseDown={(e) => e.preventDefault()}
    >
      <span className="text-[11px] font-medium text-muted-foreground">
        Highlight
      </span>
      <PdfColorPicker onSelect={onSelect} />
    </div>
  )
}
