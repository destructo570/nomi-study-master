"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Delete02Icon,
  Image01Icon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"

import type { Notebook } from "@workspace/types"
import { notebookCoverImagePath } from "@workspace/types"

export type NotebookCardVariant = "grid" | "list"

type NotebookCardProps = {
  notebook: Notebook
  shelfName?: string
  /** Override the cover image (used by previews / dummies). */
  coverImage?: string
  variant?: NotebookCardVariant
  onRename?: () => void
  onDelete?: () => void
  onChangeCover?: () => void
}

export function NotebookCard({
  notebook,
  shelfName,
  coverImage,
  variant = "grid",
  onRename,
  onDelete,
  onChangeCover,
}: NotebookCardProps) {
  const updated = new Date(notebook.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
  const resolvedCoverImage =
    coverImage ??
    (notebook.cover ? notebookCoverImagePath(notebook.cover) : undefined)
  const hasActions = !!(onRename || onDelete || onChangeCover)

  if (variant === "list") {
    return (
      <div className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-border bg-card px-3 py-2.5 transition hover:border-foreground/20 hover:shadow-hairline">
        <Link
          href={`/notebook/${notebook.id}`}
          className="absolute inset-0 z-0"
          aria-label={`Open ${notebook.title}`}
        />
        {resolvedCoverImage && (
          <div className="relative size-14 shrink-0 overflow-hidden rounded-md">
            <img
              src={resolvedCoverImage}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-sm font-medium">{notebook.title}</h3>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {shelfName ? `${shelfName} · ` : ""}Updated {updated}
          </p>
        </div>
        {hasActions && (
          <NotebookActionsMenu
            onRename={onRename}
            onDelete={onDelete}
            onChangeCover={onChangeCover}
            className="relative z-10"
          />
        )}
      </div>
    )
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-foreground/20 hover:shadow-hairline">
      <Link
        href={`/notebook/${notebook.id}`}
        className="absolute inset-0 z-0"
        aria-label={`Open ${notebook.title}`}
      />

      {resolvedCoverImage && (
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={resolvedCoverImage}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        </div>
      )}

      <div className="space-y-1 bg-muted/60 px-4 py-3">
        <h3 className="line-clamp-1 text-sm font-medium">{notebook.title}</h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {shelfName ? `${shelfName} · ` : ""}Updated {updated}
        </p>
      </div>

      {hasActions && (
        <NotebookActionsMenu
          onRename={onRename}
          onDelete={onDelete}
          onChangeCover={onChangeCover}
          className="absolute top-2 right-2 z-10 opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
        />
      )}
    </div>
  )
}

function NotebookActionsMenu({
  className,
  onRename,
  onDelete,
  onChangeCover,
}: {
  className?: string
  onRename?: () => void
  onDelete?: () => void
  onChangeCover?: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(
              "cursor-pointer rounded-md bg-background/70 p-1 text-foreground/70 backdrop-blur-sm transition hover:bg-background hover:text-foreground",
              className,
            )}
            aria-label="Notebook actions"
            onClick={(e) => e.stopPropagation()}
          >
            <HugeiconsIcon
              icon={MoreHorizontalIcon}
              strokeWidth={2}
              className="size-4"
            />
          </button>
        }
      />
      <DropdownMenuContent align="end">
        {onRename && (
          <DropdownMenuItem onClick={onRename}>
            <HugeiconsIcon
              icon={PencilEdit02Icon}
              strokeWidth={2}
              className="size-4"
            />
            Rename
          </DropdownMenuItem>
        )}
        {onChangeCover && (
          <DropdownMenuItem onClick={onChangeCover}>
            <HugeiconsIcon
              icon={Image01Icon}
              strokeWidth={2}
              className="size-4"
            />
            Change cover
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <HugeiconsIcon
              icon={Delete02Icon}
              strokeWidth={2}
              className="size-4"
            />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
