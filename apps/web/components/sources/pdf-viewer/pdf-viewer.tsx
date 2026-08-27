"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Document, type DocumentProps } from "react-pdf"

type LoadedPdf = Parameters<NonNullable<DocumentProps["onLoadSuccess"]>>[0]

import "./pdfjs-setup"

import { cn } from "@workspace/ui/lib/utils"

import type { Annotation, AnnotationColor, AnnotationRect } from "@workspace/types"

import {
  useAnnotations,
  useCreateAnnotation,
  useDeleteAnnotation,
  useUpdateAnnotation,
} from "@/lib/hooks/use-annotations"

import { PdfAnnotationsPanel } from "./pdf-annotations-panel"
import { PdfEditAnnotationToolbar } from "./pdf-edit-annotation-toolbar"
import { PdfPage } from "./pdf-page"
import { PdfSearchPanel } from "./pdf-search-panel"
import { PdfSelectionToolbar } from "./pdf-selection-toolbar"
import { PdfThumbnailsPanel } from "./pdf-thumbnails-panel"
import { PdfToolbar } from "./pdf-toolbar"
import type { PendingAnnotation, SidebarTab, ZoomMode } from "./types"

type PdfViewerProps = {
  src: string
  sourceId: string
  fileName: string | null
  fillHeight?: boolean
}

const HORIZONTAL_PADDING = 32
const VERTICAL_PADDING = 48
const ZOOM_STORAGE_KEY = "arkive:pdf:zoom"

function readStoredZoom(): ZoomMode | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(ZOOM_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ZoomMode> | null
    if (!parsed || typeof parsed !== "object") return null
    if (parsed.kind === "width" || parsed.kind === "fit") {
      return { kind: parsed.kind }
    }
    if (
      parsed.kind === "scale" &&
      typeof parsed.value === "number" &&
      Number.isFinite(parsed.value) &&
      parsed.value > 0
    ) {
      return { kind: "scale", value: parsed.value }
    }
  } catch {
    // ignore
  }
  return null
}

export function PdfViewer({
  src,
  sourceId,
  fileName,
  fillHeight,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState<ZoomMode>(
    () => readStoredZoom() ?? { kind: "width" },
  )
  const [sidebar, setSidebar] = useState<SidebarTab | null>(null)
  const [intrinsicSize, setIntrinsicSize] = useState<{
    width: number
    height: number
  } | null>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [pending, setPending] = useState<PendingAnnotation | null>(null)
  const [editing, setEditing] = useState<{
    annotation: Annotation
    anchor: { top: number; left: number }
  } | null>(null)
  const [flash, setFlash] = useState<{ page: number; id: string | null } | null>(
    null,
  )

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(ZOOM_STORAGE_KEY, JSON.stringify(zoom))
    } catch {
      // ignore
    }
  }, [zoom])

  const containerRef = useRef<HTMLDivElement | null>(null)
  const pageRefs = useRef(new Map<number, HTMLDivElement>())
  const suppressObserver = useRef(false)

  const annotationsQuery = useAnnotations(sourceId)
  const createAnnotation = useCreateAnnotation(sourceId)
  const updateAnnotation = useUpdateAnnotation(sourceId)
  const deleteAnnotation = useDeleteAnnotation(sourceId)
  const annotations = annotationsQuery.data ?? []

  const annotationsByPage = useMemo(() => {
    const map = new Map<number, Annotation[]>()
    for (const a of annotations) {
      const list = map.get(a.page)
      if (list) list.push(a)
      else map.set(a.page, [a])
    }
    return map
  }, [annotations])

  // ResizeObserver on container
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const e = entries[0]
      if (!e) return
      const { width, height } = e.contentRect
      setContainerSize({ width, height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Intersection observer to track current page in viewport
  useEffect(() => {
    const root = containerRef.current
    if (!root || numPages === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (suppressObserver.current) return
        let best: { page: number; ratio: number } | null = null
        for (const entry of entries) {
          const ratio = entry.intersectionRatio
          const num = Number(
            (entry.target as HTMLElement).dataset.pageNumber ?? "0",
          )
          if (!num) continue
          if (!best || ratio > best.ratio) best = { page: num, ratio }
        }
        if (best && best.ratio > 0) {
          setCurrentPage(best.page)
        }
      },
      { root, threshold: [0, 0.25, 0.5, 0.75, 1] },
    )
    pageRefs.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [numPages])

  const onPageMounted = useCallback(
    (page: number, el: HTMLDivElement | null) => {
      if (el) pageRefs.current.set(page, el)
      else pageRefs.current.delete(page)
    },
    [],
  )

  const onPageRender = useCallback(
    (page: number, size: { width: number; height: number }) => {
      if (page === 1 && (!intrinsicSize || intrinsicSize.width !== size.width)) {
        setIntrinsicSize(size)
      }
    },
    [intrinsicSize],
  )

  // Compute the rendered page width (CSS px) given zoom mode + container
  const pageWidth = useMemo(() => {
    if (!intrinsicSize || containerSize.width === 0) return 0
    const availW =
      Math.max(0, containerSize.width - HORIZONTAL_PADDING) -
      (sidebar ? 0 : 0)
    const availH = Math.max(0, containerSize.height - VERTICAL_PADDING)
    if (zoom.kind === "scale") {
      return intrinsicSize.width * zoom.value
    }
    if (zoom.kind === "width") {
      return Math.max(120, availW)
    }
    // fit
    const fitScale = Math.min(
      availW / intrinsicSize.width,
      availH / intrinsicSize.height,
    )
    return Math.max(120, intrinsicSize.width * fitScale)
  }, [zoom, intrinsicSize, containerSize, sidebar])

  const effectiveScale = intrinsicSize
    ? pageWidth / intrinsicSize.width
    : zoom.kind === "scale"
      ? zoom.value
      : 1

  const onDocumentLoad = useCallback(async (pdf: LoadedPdf) => {
    setNumPages(pdf.numPages)
    try {
      const firstPage = await pdf.getPage(1)
      const vp = firstPage.getViewport({ scale: 1 })
      setIntrinsicSize({ width: vp.width, height: vp.height })
    } catch {
      // Fallback to A4-ish portrait if metadata is unavailable.
      setIntrinsicSize({ width: 612, height: 792 })
    }
  }, [])

  const onJumpToPage = useCallback((page: number) => {
    const el = pageRefs.current.get(page)
    if (!el) return
    suppressObserver.current = true
    el.scrollIntoView({ behavior: "smooth", block: "start" })
    setCurrentPage(page)
    window.setTimeout(() => {
      suppressObserver.current = false
    }, 600)
  }, [])

  const flashAnnotation = useCallback(
    (page: number, id: string) => {
      setFlash({ page, id })
      window.setTimeout(() => setFlash(null), 1200)
    },
    [],
  )

  const onJumpToAnnotation = useCallback(
    (a: Annotation) => {
      onJumpToPage(a.page)
      window.setTimeout(() => flashAnnotation(a.page, a.id), 350)
    },
    [onJumpToPage, flashAnnotation],
  )

  const handleToggleSidebar = useCallback((tab: SidebarTab) => {
    setSidebar((prev) => (prev === tab ? null : tab))
  }, [])

  // Selection handler - listens for mouseup inside the page area
  useEffect(() => {
    function onMouseUp() {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setPending(null)
        return
      }
      const range = sel.getRangeAt(0)
      const node = range.commonAncestorContainer
      const ancestor =
        node.nodeType === 1 ? (node as Element) : node.parentElement
      const pageEl = ancestor?.closest(
        "[data-pdf-page-wrapper]",
      ) as HTMLElement | null
      if (!pageEl) {
        setPending(null)
        return
      }
      const text = sel.toString().trim()
      if (text.length < 2) {
        setPending(null)
        return
      }
      const pageNum = Number(pageEl.dataset.pageNumber ?? "0")
      const pageRect = pageEl.getBoundingClientRect()
      if (pageRect.width === 0 || pageRect.height === 0) return
      const clientRects = Array.from(range.getClientRects())
      const rects: AnnotationRect[] = clientRects
        .map((r) => ({
          x: (r.left - pageRect.left) / pageRect.width,
          y: (r.top - pageRect.top) / pageRect.height,
          w: r.width / pageRect.width,
          h: r.height / pageRect.height,
        }))
        .filter((r) => r.w > 0 && r.h > 0)
      if (rects.length === 0) {
        setPending(null)
        return
      }
      const last = clientRects[clientRects.length - 1] ?? clientRects[0]
      if (!last) {
        setPending(null)
        return
      }
      setEditing(null)
      setPending({
        page: pageNum,
        quotedText: text,
        rects,
        anchor: {
          top: last.bottom + 6,
          left: last.left + last.width / 2,
        },
      })
    }
    function onMouseDown(e: MouseEvent) {
      // Clicking outside an annotation/selection toolbar dismisses both.
      const target = e.target as Element | null
      if (!target) return
      if (target.closest("[data-pdf-floating]")) return
      if (target.closest("[data-annotation-overlay] button")) return
      setPending(null)
      setEditing(null)
    }
    document.addEventListener("mouseup", onMouseUp)
    document.addEventListener("mousedown", onMouseDown)
    return () => {
      document.removeEventListener("mouseup", onMouseUp)
      document.removeEventListener("mousedown", onMouseDown)
    }
  }, [])

  const handleCreateAnnotation = useCallback(
    (color: AnnotationColor) => {
      if (!pending) return
      createAnnotation.mutate({
        page: pending.page,
        color,
        quotedText: pending.quotedText,
        rects: pending.rects,
      })
      setPending(null)
      window.getSelection()?.removeAllRanges()
    },
    [pending, createAnnotation],
  )

  const handleAnnotationClick = useCallback(
    (annotation: Annotation, anchor: { top: number; left: number }) => {
      setPending(null)
      setEditing({ annotation, anchor })
    },
    [],
  )

  const handleAnnotationColor = useCallback(
    (annotationId: string, color: AnnotationColor) => {
      updateAnnotation.mutate({ id: annotationId, color })
    },
    [updateAnnotation],
  )

  const handleAnnotationCommentSave = useCallback(
    (annotationId: string, comment: string | null) => {
      updateAnnotation.mutate({ id: annotationId, comment })
    },
    [updateAnnotation],
  )

  const handleAnnotationDelete = useCallback(
    (annotationId: string) => {
      deleteAnnotation.mutate(annotationId)
      setEditing(null)
    },
    [deleteAnnotation],
  )

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-muted/20 py-0",
        fillHeight ? "h-full min-h-0" : "h-[calc(100vh-9rem)] min-h-[480px]",
      )}
    >
      <PdfToolbar
        currentPage={currentPage}
        numPages={numPages}
        onJumpToPage={onJumpToPage}
        zoom={zoom}
        effectiveScale={effectiveScale}
        onZoomChange={setZoom}
        sidebar={sidebar}
        onToggleSidebar={handleToggleSidebar}
        fileUrl={src}
        fileName={fileName}
      />

      <div className="flex min-h-0 min-w-0 flex-1">
        {sidebar === "search" && (
          <PdfSearchPanel
            src={src}
            numPages={numPages}
            onClose={() => setSidebar(null)}
            onJumpToPage={onJumpToPage}
          />
        )}
        {sidebar === "thumbnails" && (
          <PdfThumbnailsPanel
            src={src}
            numPages={numPages}
            currentPage={currentPage}
            onClose={() => setSidebar(null)}
            onJumpToPage={onJumpToPage}
          />
        )}
        {sidebar === "annotations" && (
          <PdfAnnotationsPanel
            annotations={annotations}
            onClose={() => setSidebar(null)}
            onJumpToAnnotation={onJumpToAnnotation}
            onDeleteAnnotation={handleAnnotationDelete}
          />
        )}

        <div
          ref={containerRef}
          className="min-w-0 flex-1 overflow-auto"
          data-pdf-scroll
        >
          <Document
            file={src}
            onLoadSuccess={onDocumentLoad}
            loading={<DocumentLoading />}
            error={<DocumentError />}
            className="flex w-full flex-col gap-4 px-4 py-6"
          >
            {numPages > 0 &&
              pageWidth > 0 &&
              Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
                <PdfPage
                  key={p}
                  pageNumber={p}
                  width={pageWidth}
                  annotations={annotationsByPage.get(p) ?? []}
                  flashAnnotationId={flash?.id ?? null}
                  flashPage={flash?.page ?? null}
                  onPageMounted={onPageMounted}
                  onPageRender={onPageRender}
                  onAnnotationClick={handleAnnotationClick}
                  onAnnotationColor={handleAnnotationColor}
                />
              ))}
          </Document>
        </div>
      </div>

      {pending && (
        <PdfSelectionToolbar
          anchor={pending.anchor}
          onSelect={handleCreateAnnotation}
        />
      )}
      {editing && (
        <PdfEditAnnotationToolbar
          annotation={editing.annotation}
          anchor={editing.anchor}
          onColor={(c) => handleAnnotationColor(editing.annotation.id, c)}
          onCommentSave={(c) =>
            handleAnnotationCommentSave(editing.annotation.id, c)
          }
          onDelete={() => handleAnnotationDelete(editing.annotation.id)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function DocumentLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8 text-sm text-muted-foreground">
      Loading PDF…
    </div>
  )
}

function DocumentError() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8 text-sm text-destructive">
      Failed to load PDF.
    </div>
  )
}
