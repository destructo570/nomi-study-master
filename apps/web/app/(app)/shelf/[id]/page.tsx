"use client"

import { use, useState } from "react"
import { notFound } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  GridViewIcon,
  LeftToRightListBulletIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import {
  useDeleteNotebook,
  useNotebooksByShelf,
  useRenameNotebook,
  useShelf,
} from "@/lib/hooks/use-workspace"
import { PromptDialog } from "@/components/prompt-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { CreateNotebookDialog } from "@/components/notebook/create-notebook-dialog"
import { EditCoverDialog } from "@/components/notebook/edit-cover-dialog"
import { NotebookCard } from "@/components/notebook-card"
import { DocumentTitle } from "@/components/seo/document-title"
import { EmptyState } from "@/components/empty-state"
import { randomNotebookCover } from "@workspace/types"

type DialogState =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "rename"; id: string; title: string }
  | { kind: "delete"; id: string; title: string }
  | { kind: "cover"; id: string; cover?: string }

export default function ShelfPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const shelfQuery = useShelf(id)
  const notebooksQuery = useNotebooksByShelf(id)
  const renameNotebook = useRenameNotebook()
  const deleteNotebook = useDeleteNotebook()
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" })
  const [view, setView] = useState<"grid" | "list">("grid")
  const close = () => setDialog({ kind: "none" })

  if (shelfQuery.isSuccess && !shelfQuery.data) notFound()
  const shelf = shelfQuery.data

  return (
    <div className="pb-8">
      <DocumentTitle title={shelf?.name} />

      <div className="mx-auto max-w-5xl space-y-8 px-8 pt-8">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              {shelf?.name ?? "…"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {notebooksQuery.data?.length ?? 0} notebook
              {notebooksQuery.data?.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ViewToggle value={view} onChange={setView} />
            <Button onClick={() => setDialog({ kind: "create" })}>
              <HugeiconsIcon
                icon={PlusSignIcon}
                strokeWidth={2}
                className="size-4"
              />
              New notebook
            </Button>
          </div>
        </div>

        {notebooksQuery.data && notebooksQuery.data.length === 0 ? (
          <EmptyState
            image="/images/empty-states/chilling_on_floor.png"
            imageOpacity={0.25}
            title="No notebooks yet"
            description="Create your first one."
          />
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notebooksQuery.data?.map((nb) => (
              <NotebookCard
                key={nb.id}
                notebook={nb}
                variant="grid"
                onRename={() =>
                  setDialog({ kind: "rename", id: nb.id, title: nb.title })
                }
                onChangeCover={() =>
                  setDialog({ kind: "cover", id: nb.id, cover: nb.cover })
                }
                onDelete={() =>
                  setDialog({ kind: "delete", id: nb.id, title: nb.title })
                }
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notebooksQuery.data?.map((nb) => (
              <NotebookCard
                key={nb.id}
                notebook={nb}
                variant="list"
                onRename={() =>
                  setDialog({ kind: "rename", id: nb.id, title: nb.title })
                }
                onChangeCover={() =>
                  setDialog({ kind: "cover", id: nb.id, cover: nb.cover })
                }
                onDelete={() =>
                  setDialog({ kind: "delete", id: nb.id, title: nb.title })
                }
              />
            ))}
          </div>
        )}
      </div>

      <CreateNotebookDialog
        open={dialog.kind === "create"}
        onOpenChange={(v) => !v && close()}
        shelfId={id}
      />

      <PromptDialog
        open={dialog.kind === "rename"}
        onOpenChange={(v) => !v && close()}
        title="Rename notebook"
        label="Title"
        defaultValue={dialog.kind === "rename" ? dialog.title : ""}
        confirmLabel="Rename"
        onSubmit={(title) => {
          if (dialog.kind !== "rename") return
          return renameNotebook.mutateAsync({ id: dialog.id, title })
        }}
      />

      <EditCoverDialog
        open={dialog.kind === "cover"}
        onOpenChange={(v) => !v && close()}
        notebookId={dialog.kind === "cover" ? dialog.id : null}
        currentCover={dialog.kind === "cover" ? dialog.cover : undefined}
        fallbackCover={randomNotebookCover()}
      />

      <ConfirmDialog
        open={dialog.kind === "delete"}
        onOpenChange={(v) => !v && close()}
        title={
          dialog.kind === "delete" ? `Delete ${dialog.title}?` : "Delete?"
        }
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (dialog.kind !== "delete") return
          return deleteNotebook.mutateAsync({ id: dialog.id, shelfId: id })
        }}
      />
    </div>
  )
}

function ViewToggle({
  value,
  onChange,
}: {
  value: "grid" | "list"
  onChange: (next: "grid" | "list") => void
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5">
      <ToggleButton
        active={value === "grid"}
        label="Grid view"
        onClick={() => onChange("grid")}
        icon={GridViewIcon}
      />
      <ToggleButton
        active={value === "list"}
        label="List view"
        onClick={() => onChange("list")}
        icon={LeftToRightListBulletIcon}
      />
    </div>
  )
}

function ToggleButton({
  active,
  label,
  onClick,
  icon,
}: {
  active: boolean
  label: string
  onClick: () => void
  icon: typeof GridViewIcon
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-7 items-center justify-center rounded-full transition",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-3.5" />
    </button>
  )
}
