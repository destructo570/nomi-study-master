"use client"

import dynamic from "next/dynamic"

export const PdfViewer = dynamic(
  () => import("./pdf-viewer").then((m) => m.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-9rem)] min-h-[480px] items-center justify-center rounded-xl border border-border bg-muted/20 text-sm text-muted-foreground">
        Loading PDF…
      </div>
    ),
  },
)
