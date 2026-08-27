"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArchiveRestoreIcon,
  Delete02Icon,
  FileEmpty02Icon,
  Folder01Icon,
  Note02Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"

import {
  useArchive,
  useDeleteArchived,
  useEmptyArchive,
  useRestoreArchived,
} from "@/lib/hooks/use-archive"
import type { ArchiveItemType } from "@/lib/api"
import { ConfirmDialog } from "@/components/confirm-dialog"

type IconObject = Parameters<typeof HugeiconsIcon>[0]["icon"]

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function ArchivePage() {
  const archive = useArchive()
  const restore = useRestoreArchived()
  const remove = useDeleteArchived()
  const empty = useEmptyArchive()

  const [emptyOpen, setEmptyOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: ArchiveItemType
    id: string
    label: string
  } | null>(null)

  const data = archive.data
  const total =
    (data?.shelves.length ?? 0) +
    (data?.notebooks.length ?? 0) +
    (data?.sources.length ?? 0)

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-6 md:px-8 md:py-8">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            Archive
          </h1>
          <Button
            variant="destructive"
            size="sm"
            disabled={total === 0 || empty.isPending}
            onClick={() => setEmptyOpen(true)}
          >
            Empty archive
          </Button>
        </div>
        <p className="text-sm text-muted-foreground md:text-base">
          Items you delete land here. Restore them, remove them one by one, or
          empty the archive. Anything left in the archive is permanently
          deleted after 20 days.
        </p>
      </header>

      {archive.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : total === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 px-8 py-16 text-center">
          <p className="font-heading text-lg">Nothing in your archive.</p>
          <p className="text-sm text-muted-foreground">
            Deleted shelves, notebooks, and sources will show up here.
          </p>
        </Card>
      ) : (
        <div className="space-y-10">
          <ArchiveSection
            title="Shelves"
            icon={Folder01Icon}
            items={(data?.shelves ?? []).map((s) => ({
              id: s.id,
              type: "shelf" as const,
              primary: s.name,
              secondary: `Archived ${formatRelative(s.archivedAt)}`,
            }))}
            onRestore={(id) => restore.mutate({ type: "shelf", id })}
            onDelete={(id, label) =>
              setDeleteTarget({ type: "shelf", id, label })
            }
          />
          <ArchiveSection
            title="Notebooks"
            icon={Note02Icon}
            items={(data?.notebooks ?? []).map((n) => ({
              id: n.id,
              type: "notebook" as const,
              primary: `${n.icon ?? "📓"}  ${n.title}`,
              secondary: `In ${n.shelfName} · archived ${formatRelative(n.archivedAt)}`,
            }))}
            onRestore={(id) => restore.mutate({ type: "notebook", id })}
            onDelete={(id, label) =>
              setDeleteTarget({ type: "notebook", id, label })
            }
          />
          <ArchiveSection
            title="Sources"
            icon={FileEmpty02Icon}
            items={(data?.sources ?? []).map((s) => ({
              id: s.id,
              type: "source" as const,
              primary: s.title,
              secondary: `In ${s.notebookTitle} · archived ${formatRelative(s.archivedAt)}`,
            }))}
            onRestore={(id) => restore.mutate({ type: "source", id })}
            onDelete={(id, label) =>
              setDeleteTarget({ type: "source", id, label })
            }
          />
        </div>
      )}

      <ConfirmDialog
        open={emptyOpen}
        onOpenChange={setEmptyOpen}
        title="Empty the archive?"
        description="This permanently deletes everything in your archive. This cannot be undone."
        confirmLabel="Empty archive"
        destructive
        onConfirm={() => empty.mutateAsync()}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.label ?? ""}"?`}
        description="This permanently deletes this item. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!deleteTarget) return
          await remove.mutateAsync({
            type: deleteTarget.type,
            id: deleteTarget.id,
          })
        }}
      />
    </div>
  )
}

type ArchiveItem = {
  id: string
  type: ArchiveItemType
  primary: string
  secondary: string
}

function ArchiveSection({
  title,
  icon,
  items,
  onRestore,
  onDelete,
}: {
  title: string
  icon: IconObject
  items: ArchiveItem[]
  onRestore: (id: string) => void
  onDelete: (id: string, label: string) => void
}) {
  if (items.length === 0) return null
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-lg font-medium">
        {title}
        <span className="ml-2 text-sm text-muted-foreground">
          ({items.length})
        </span>
      </h2>
      <div className="divide-y rounded-xl border">
        {items.map((item) => (
          <div
            key={`${item.type}:${item.id}`}
            className="flex items-center gap-3 px-4 py-3"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <HugeiconsIcon
                icon={icon}
                strokeWidth={2}
                className="size-4 text-muted-foreground"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.primary}</p>
              <p className="truncate text-xs text-muted-foreground">
                {item.secondary}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRestore(item.id)}
            >
              <HugeiconsIcon
                icon={ArchiveRestoreIcon}
                strokeWidth={2}
                className="size-4"
              />
              Restore
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(item.id, item.primary)}
            >
              <HugeiconsIcon
                icon={Delete02Icon}
                strokeWidth={2}
                className="size-4"
              />
              Delete
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}
