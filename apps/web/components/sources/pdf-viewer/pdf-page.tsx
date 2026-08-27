"use client"

import { useCallback, useEffect, useRef } from "react"
import { Page } from "react-pdf"

import type { Annotation, AnnotationColor } from "@workspace/types"

import { AnnotationOverlay } from "./pdf-annotation-overlay"
import { COLOR_STYLES } from "./types"

type PdfPageProps = {
  pageNumber: number
  width: number
  annotations: Annotation[]
  flashAnnotationId: string | null
  flashPage: number | null
  onPageMounted: (page: number, el: HTMLDivElement | null) => void
  onPageRender: (page: number, size: { width: number; height: number }) => void
  onAnnotationClick: (
    annotation: Annotation,
    anchor: { top: number; left: number },
  ) => void
  onAnnotationColor: (annotationId: string, color: AnnotationColor) => void
}

export function PdfPage({
  pageNumber,
  width,
  annotations,
  flashAnnotationId,
  flashPage,
  onPageMounted,
  onPageRender,
  onAnnotationClick,
  onAnnotationColor,
}: PdfPageProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      wrapperRef.current = el
      onPageMounted(pageNumber, el)
    },
    [onPageMounted, pageNumber],
  )

  const renderedSize = useRef<{ width: number; height: number } | null>(null)

  // Re-emit render size when width changes so parents can reposition overlays.
  useEffect(() => {
    if (renderedSize.current) {
      onPageRender(pageNumber, renderedSize.current)
    }
  }, [width, pageNumber, onPageRender])

  return (
    <div
      ref={setRef}
      data-pdf-page-wrapper
      data-page-number={pageNumber}
      className="pdf-viewer-page relative mx-auto bg-white shadow-sm ring-1 ring-border/40"
      style={{ width }}
    >
      <Page
        pageNumber={pageNumber}
        width={width}
        renderTextLayer
        renderAnnotationLayer={false}
        onRenderSuccess={(p) => {
          const vp = p.getViewport({ scale: 1 })
          const size = { width: vp.width, height: vp.height }
          renderedSize.current = size
          onPageRender(pageNumber, size)
        }}
      />
      <AnnotationOverlay
        annotations={annotations}
        flashAnnotationId={
          flashPage === pageNumber ? flashAnnotationId : null
        }
        onClick={onAnnotationClick}
        onColor={onAnnotationColor}
      />
    </div>
  )
}

export function getColorStyle(color: AnnotationColor) {
  return COLOR_STYLES[color] ?? COLOR_STYLES.yellow
}
