import type { AnnotationColor, AnnotationRect } from "@workspace/types"

export type ZoomMode =
  | { kind: "fit" }
  | { kind: "width" }
  | { kind: "scale"; value: number }

export type SidebarTab = "search" | "thumbnails" | "annotations"

export type PendingAnnotation = {
  page: number
  quotedText: string
  rects: AnnotationRect[]
  anchor: { top: number; left: number }
}

export type ColorClassMap = Record<AnnotationColor, { bg: string; dot: string }>

export const COLOR_STYLES: ColorClassMap = {
  yellow: { bg: "bg-amber-200", dot: "bg-amber-200" },
  green: { bg: "bg-emerald-200", dot: "bg-emerald-200" },
  blue: { bg: "bg-sky-200", dot: "bg-sky-200" },
  pink: { bg: "bg-rose-200", dot: "bg-rose-200" },
  purple: { bg: "bg-violet-200", dot: "bg-violet-200" },
}
