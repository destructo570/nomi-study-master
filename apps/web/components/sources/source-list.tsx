"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  AudioWave01Icon,
  Delete02Icon,
  File01Icon,
  Link01Icon,
  TextIcon,
  VideoReplayIcon,
  YoutubeIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import type { Source } from "@workspace/types"
import { SUPPORTED_UPLOAD_MIMES } from "@workspace/types"

function iconFor(s: Source): IconSvgElement {
  if (s.type === "text") return TextIcon
  if (s.type === "youtube") return YoutubeIcon
  if (s.type === "article") return Link01Icon
  const mime = s.mimeType ?? ""
  if (mime === SUPPORTED_UPLOAD_MIMES.mp4) return VideoReplayIcon
  if (
    mime === SUPPORTED_UPLOAD_MIMES.mp3 ||
    mime === SUPPORTED_UPLOAD_MIMES.m4a ||
    mime === SUPPORTED_UPLOAD_MIMES.aac
  ) {
    return AudioWave01Icon
  }
  return File01Icon
}

function statusLabel(s: Source): string | null {
  if (s.status === "ready") return null
  if (s.status === "processing") return "Processing…"
  if (s.status === "pending_upload") return "Uploading…"
  if (s.status === "failed") return s.errorMessage ?? "Failed"
  return null
}

type SourceListProps = {
  sources: Source[]
  onDelete?: (id: string) => void
  className?: string
}

export function SourceList({ sources, onDelete, className }: SourceListProps) {
  if (sources.length === 0) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        No sources yet.
      </p>
    )
  }
  return (
    <ul className={cn("space-y-1", className)}>
      {sources.map((s) => {
        const status = statusLabel(s)
        return (
          <li
            key={s.id}
            className="group flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm"
          >
            <HugeiconsIcon
              icon={iconFor(s)}
              strokeWidth={2}
              className="size-4 shrink-0 text-muted-foreground"
            />
            <span className="min-w-0 flex-1 truncate">{s.title}</span>
            {status && (
              <span
                title={s.errorMessage ?? undefined}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  s.status === "failed"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {status}
              </span>
            )}
            {onDelete && (
              <Button
                size="icon-sm"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100"
                onClick={() => onDelete(s.id)}
                aria-label={`Remove ${s.title}`}
              >
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
