"use client"

import type { Annotation, AnnotationColor } from "@workspace/types"

import { cn } from "@workspace/ui/lib/utils"

import { COLOR_STYLES } from "./types"

type AnnotationOverlayProps = {
  annotations: Annotation[]
  flashAnnotationId: string | null
  onClick: (
    annotation: Annotation,
    anchor: { top: number; left: number },
  ) => void
  onColor?: (annotationId: string, color: AnnotationColor) => void
}

export function AnnotationOverlay({
  annotations,
  flashAnnotationId,
  onClick,
}: AnnotationOverlayProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      data-annotation-overlay
    >
      {annotations.map((a) => {
        const style = COLOR_STYLES[a.color] ?? COLOR_STYLES.yellow
        return a.rects.map((r, i) => (
          <button
            type="button"
            key={`${a.id}-${i}`}
            onClick={(e) => {
              e.stopPropagation()
              const target = e.currentTarget.getBoundingClientRect()
              onClick(a, {
                top: target.bottom,
                left: target.left + target.width / 2,
              })
            }}
            className={cn(
              "pointer-events-auto absolute cursor-pointer rounded-sm transition-shadow mix-blend-multiply",
              style.bg,
              flashAnnotationId === a.id &&
                "ring-2 ring-offset-1 ring-foreground/60",
            )}
            style={{
              left: `${r.x * 100}%`,
              top: `${r.y * 100}%`,
              width: `${r.w * 100}%`,
              height: `${r.h * 100}%`,
            }}
            aria-label={a.quotedText.slice(0, 60)}
          />
        ))
      })}
    </div>
  )
}
