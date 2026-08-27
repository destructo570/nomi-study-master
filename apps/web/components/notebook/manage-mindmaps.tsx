"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  Edit02Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { useDeleteMindmap, useUpdateMindmap } from "@/lib/hooks/use-mindmaps"
import type { Mindmap } from "@workspace/types"

type Props = {
  notebookId: string
  mindmaps: Mindmap[]
  onBack: () => void
}

export function ManageMindmapsSection({ notebookId, mindmaps, onBack }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<Mindmap | null>(null)
  const remove = useDeleteMindmap(notebookId)

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await remove.mutateAsync(deleteTarget.id)
    } catch {
      toast.error("Failed to delete mindmap.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Button type="button" size="sm" variant="ghost" onClick={onBack}>
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
          Go back
        </Button>
        <div className="text-right">
          <h2 className="text-lg font-semibold tracking-tight">Manage mindmaps</h2>
          <p className="text-xs text-muted-foreground">
            Rename or delete mindmaps in this notebook.
          </p>
        </div>
      </div>

      {mindmaps.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
          No mindmaps yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {mindmaps.map((m) => (
            <ManageRow
              key={m.id}
              mindmap={m}
              notebookId={notebookId}
              onRequestDelete={() => setDeleteTarget(m)}
              deleting={remove.isPending && deleteTarget?.id === m.id}
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={deleteTarget ? `Delete "${deleteTarget.title}"?` : "Delete mindmap?"}
        description="This mindmap and all its nodes will be permanently deleted. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function ManageRow({
  mindmap,
  notebookId,
  onRequestDelete,
  deleting,
}: {
  mindmap: Mindmap
  notebookId: string
  onRequestDelete: () => void
  deleting: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(mindmap.title)
  const update = useUpdateMindmap(notebookId)

  useEffect(() => {
    if (!editing) setTitle(mindmap.title)
  }, [mindmap.title, editing])

  async function save() {
    const next = title.trim()
    if (!next) {
      toast.error("Title cannot be empty.")
      return
    }
    if (next === mindmap.title) {
      setEditing(false)
      return
    }
    try {
      await update.mutateAsync({ id: mindmap.id, title: next })
      setEditing(false)
    } catch {
      toast.error("Failed to rename mindmap.")
    }
  }

  const updated = new Date(mindmap.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const nodeCount = mindmap.data.nodes.length

  return (
    <li
      className={cn(
        "rounded-2xl border border-border bg-background p-3",
        editing && "border-primary/30 ring-1 ring-primary/10",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {editing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mindmap title"
              disabled={update.isPending}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  void save()
                } else if (e.key === "Escape") {
                  e.preventDefault()
                  setTitle(mindmap.title)
                  setEditing(false)
                }
              }}
            />
          ) : (
            <p className="truncate text-sm font-medium text-foreground">
              {mindmap.title}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {nodeCount} {nodeCount === 1 ? "node" : "nodes"} · Updated {updated}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {editing ? (
            <>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={save}
                disabled={update.isPending}
                aria-label="Save"
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  strokeWidth={2}
                  className="size-4"
                />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => {
                  setTitle(mindmap.title)
                  setEditing(false)
                }}
                disabled={update.isPending}
                aria-label="Cancel"
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  strokeWidth={2}
                  className="size-4"
                />
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => setEditing(true)}
                aria-label="Rename"
              >
                <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={onRequestDelete}
                disabled={deleting}
                aria-label="Delete"
                className="text-destructive hover:text-destructive"
              >
                <HugeiconsIcon
                  icon={Delete02Icon}
                  strokeWidth={2}
                  className="size-4"
                />
              </Button>
            </>
          )}
        </div>
      </div>
    </li>
  )
}
