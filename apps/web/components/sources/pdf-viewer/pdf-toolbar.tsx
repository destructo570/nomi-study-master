"use client"

import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Download01Icon,
  GridIcon,
  HighlighterIcon,
  LinkSquare02Icon,
  MoreVerticalIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"

import { PdfZoomMenu } from "./pdf-zoom-menu"
import type { SidebarTab, ZoomMode } from "./types"

type PdfToolbarProps = {
  currentPage: number
  numPages: number
  onJumpToPage: (page: number) => void
  zoom: ZoomMode
  effectiveScale: number
  onZoomChange: (mode: ZoomMode) => void
  sidebar: SidebarTab | null
  onToggleSidebar: (tab: SidebarTab) => void
  fileUrl: string
  fileName: string | null
}

export function PdfToolbar({
  currentPage,
  numPages,
  onJumpToPage,
  zoom,
  effectiveScale,
  onZoomChange,
  sidebar,
  onToggleSidebar,
  fileUrl,
  fileName,
}: PdfToolbarProps) {
  const [pageInput, setPageInput] = useState(String(currentPage))

  useEffect(() => {
    setPageInput(String(currentPage))
  }, [currentPage])

  function commitPage() {
    const n = Number.parseInt(pageInput, 10)
    if (Number.isFinite(n) && n >= 1 && n <= numPages) {
      onJumpToPage(n)
    } else {
      setPageInput(String(currentPage))
    }
  }

  function handleDownload() {
    const a = document.createElement("a")
    a.href = fileUrl
    a.download = fileName ?? "document.pdf"
    a.rel = "noopener"
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  function handleOpenNewTab() {
    window.open(fileUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="flex items-center gap-2 border-b border-border bg-background px-3 py-2">
      <Button
        type="button"
        size="sm"
        variant={sidebar === "annotations" ? "default" : "ghost"}
        onClick={() => onToggleSidebar("annotations")}
        className={cn(
          "h-8 gap-1.5 rounded-full px-3 text-xs font-medium",
          sidebar !== "annotations" && "text-foreground",
        )}
      >
        <HugeiconsIcon
          icon={HighlighterIcon}
          strokeWidth={2}
          className="size-4"
        />
        Annotations
      </Button>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs">
          <input
            type="text"
            inputMode="numeric"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value.replace(/[^0-9]/g, ""))}
            onBlur={commitPage}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            aria-label="Page number"
            className="w-8 bg-transparent text-center tabular-nums outline-none"
          />
          <span className="text-muted-foreground/50">/</span>
          <span className="tabular-nums text-muted-foreground/50">
            {numPages || "-"}
          </span>
        </div>

        <PdfZoomMenu
          mode={zoom}
          effectiveScale={effectiveScale}
          onChange={onZoomChange}
        />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="More"
                className="ml-1"
              >
                <HugeiconsIcon
                  icon={MoreVerticalIcon}
                  strokeWidth={2}
                  className="size-4"
                />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem onClick={() => onToggleSidebar("search")}>
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
              Search
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleSidebar("thumbnails")}>
              <HugeiconsIcon icon={GridIcon} strokeWidth={2} />
              Thumbnails
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDownload}>
              <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleOpenNewTab}>
              <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={2} />
              Open in new tab
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
