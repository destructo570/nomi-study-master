"use client"

import { useState } from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { CubeIcon, PlusSignIcon } from "@hugeicons/core-free-icons"

import {
  useCreateShelf,
  useNotebooksByShelf,
  useShelves,
} from "@/lib/hooks/use-workspace"
import { PromptDialog } from "@/components/prompt-dialog"

export default function LibraryPage() {
  const shelvesQuery = useShelves()
  const createShelf = useCreateShelf()
  const [createOpen, setCreateOpen] = useState(false)

  const shelves = (shelvesQuery.data ?? []).filter((s) => !s.archivedAt)

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-6 py-10 sm:px-8">
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-light tracking-tight">
            Library
          </h1>
          <p className="text-sm text-muted-foreground">
            All your libraries in one place.
          </p>
        </div>
      </header>

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
        {shelves.map((shelf) => (
          <ShelfCard key={shelf.id} shelfId={shelf.id} name={shelf.name} />
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
    </div>
  )
}

function ShelfCard({ shelfId, name }: { shelfId: string; name: string }) {
  const notebooksQuery = useNotebooksByShelf(shelfId)
  const count = notebooksQuery.data?.length ?? 0

  return (
    <Link
      href={`/shelf/${shelfId}`}
      className="group flex h-32 flex-col justify-between rounded-2xl border border-border bg-muted/40 p-4 transition hover:border-foreground/25 hover:shadow-hairline"
    >
      <span className="flex size-7 items-center justify-center text-amber-500">
        <HugeiconsIcon icon={CubeIcon} strokeWidth={2} className="size-5" />
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
