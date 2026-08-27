"use client"

import { use } from "react"
import { notFound } from "next/navigation"

import { Skeleton } from "@workspace/ui/components/skeleton"

import { NotesEditor } from "@/components/editor"
import { useDebouncedSaveNotebookNotes } from "@/lib/hooks/use-notes"
import { useNotebook } from "@/lib/hooks/use-workspace"

export default function NotebookNotesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const notebookQuery = useNotebook(id)
  const saveNotes = useDebouncedSaveNotebookNotes(id)

  const notebook = notebookQuery.data ?? null
  const isLoading = notebookQuery.isPending

  if (notebookQuery.isSuccess && !notebookQuery.data) notFound()

  return (
    <div className="mx-auto max-w-4xl px-8 pt-8 pb-16">
      <div className="mb-6 space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Notes</h2>
        <p className="text-sm text-muted-foreground">
          Your personal notes for this notebook.
        </p>
      </div>

      {isLoading ? (
        <NotesSkeleton />
      ) : notebook ? (
        <NotesEditor
          key={notebook.id}
          initialDoc={notebook.notes}
          onChange={(doc) => saveNotes(doc)}
          placeholder="Start writing…"
        />
      ) : null}
    </div>
  )
}

function NotesSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-full rounded-md" />
      <Skeleton className="h-4 w-[92%] rounded-md" />
      <Skeleton className="h-4 w-[88%] rounded-md" />
      <Skeleton className="h-4 w-2/3 rounded-md" />
    </div>
  )
}
