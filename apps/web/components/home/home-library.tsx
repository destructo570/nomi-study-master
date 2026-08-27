"use client"

import { useState } from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { LibraryIcon, PlusSignIcon } from "@hugeicons/core-free-icons"

import {
  useCreateShelf,
  useNotebooksByShelf,
  useShelves,
} from "@/lib/hooks/use-workspace"
import { PromptDialog } from "@/components/prompt-dialog"

const HOME_LIMIT = 4

export function HomeLibrary() {
  const shelvesQuery = useShelves()
  const createShelf = useCreateShelf()
  const [createOpen, setCreateOpen] = useState(false)

  const shelves = (shelvesQuery.data ?? []).filter((s) => !s.archivedAt)
  const visible = shelves.slice(0, HOME_LIMIT - 1)
  const hasMore = shelves.length > visible.length

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">Library</h2>
        {hasMore && (
          <Link
            href="/library"
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            View all
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card text-muted-foreground transition hover:border-foreground/25 hover:text-foreground"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon
              icon={PlusSignIcon}
              strokeWidth={2}
              className="size-5"
            />
          </span>
          <span className="text-sm font-medium">New library</span>
        </button>

        {visible.map((shelf) => (
          <LibraryCard key={shelf.id} shelfId={shelf.id} name={shelf.name} />
        ))}
      </div>

      <PromptDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New library"
        label="Library name"
        placeholder="e.g. Research"
        confirmLabel="Create"
        onSubmit={(name) => createShelf.mutateAsync(name)}
      />
    </section>
  )
}

function LibraryCard({ shelfId, name }: { shelfId: string; name: string }) {
  const notebooksQuery = useNotebooksByShelf(shelfId)
  const count = notebooksQuery.data?.length ?? 0

  return (
    <Link
      href={`/shelf/${shelfId}`}
      className="group flex h-32 flex-col justify-between rounded-2xl border border-border bg-muted/40 p-4 transition hover:border-foreground/25 hover:shadow-hairline"
    >
      <span className="flex size-14 items-start justify-start text-cinder">
        <HugeiconsIcon
          icon={LibraryIcon}
          strokeWidth={2}
          className="size-6"
        />
      </span>
      <div className="space-y-0.5">
        <div className="line-clamp-1 text-sm font-medium text-foreground">
          {name}
        </div>
        <div className="text-xs text-muted-foreground">
          {count === 0 ? "Empty" : `${count} content${count === 1 ? "" : "s"}`}
        </div>
      </div>
    </Link>
  )
}
