"use client"

import { ANNOTATION_COLORS, type AnnotationColor } from "@workspace/types"

import { cn } from "@workspace/ui/lib/utils"

import { COLOR_STYLES } from "./types"

type PdfColorPickerProps = {
  current?: AnnotationColor
  onSelect: (color: AnnotationColor) => void
  className?: string
}

export function PdfColorPicker({
  current,
  onSelect,
  className,
}: PdfColorPickerProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {ANNOTATION_COLORS.map((c) => (
        <button
          type="button"
          key={c}
          onClick={() => onSelect(c)}
          aria-label={`${c} highlight`}
          className={cn(
            "size-5 rounded-full ring-1 ring-foreground/10 transition-transform hover:scale-110",
            COLOR_STYLES[c].dot,
            current === c && "ring-2 ring-foreground",
          )}
        />
      ))}
    </div>
  )
}
