"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Delete02Icon,
  Folder01Icon,
  Folder02Icon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@workspace/ui/components/sidebar"

import type { Shelf } from "@workspace/types"
import {
  useCreateNotebook,
  useDeleteNotebook,
  useDeleteShelf,
  useNotebooksByShelf,
  useRenameNotebook,
  useRenameShelf,
} from "@/lib/hooks/use-workspace"
import { useDefaultLanguage } from "@/lib/hooks/use-me"
import { PromptDialog } from "@/components/prompt-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"

type DialogState =
  | { kind: "none" }
  | { kind: "rename-shelf" }
  | { kind: "delete-shelf" }
  | { kind: "create-notebook" }
  | { kind: "rename-notebook"; id: string; title: string }
  | { kind: "delete-notebook"; id: string; title: string }

export function SidebarShelfItem({ shelf }: { shelf: Shelf }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" })

  const notebooksQuery = useNotebooksByShelf(shelf.id)
  const renameShelf = useRenameShelf()
  const deleteShelf = useDeleteShelf()
  const createNotebook = useCreateNotebook()
  const renameNotebook = useRenameNotebook()
  const deleteNotebook = useDeleteNotebook()
  const defaultLanguage = useDefaultLanguage()

  const close = () => setDialog({ kind: "none" })

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={
          pathname === `/shelf/${shelf.id}` ||
          pathname.startsWith(`/shelf/${shelf.id}/`)
        }
        tooltip={shelf.name}
        render={
          <Link href={`/shelf/${shelf.id}`}>
            <HugeiconsIcon
              icon={open ? Folder02Icon : Folder01Icon}
              strokeWidth={2}
              className="size-4"
            />
            <span className="truncate">{shelf.name}</span>
          </Link>
        }
      />

      <SidebarMenuAction
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? `Collapse ${shelf.name}` : `Expand ${shelf.name}`}
        aria-expanded={open}
      >
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          strokeWidth={2}
          className={`size-4 transition-transform duration-100 ease-out ${open ? "rotate-90" : ""}`}
        />
      </SidebarMenuAction>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuAction
              className="end-7 hidden"
              showOnHover
              aria-label={`Actions for ${shelf.name}`}
            >
              <HugeiconsIcon
                icon={MoreHorizontalIcon}
                strokeWidth={2}
                className="size-4"
              />
            </SidebarMenuAction>
          }
        />
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem onClick={() => setDialog({ kind: "create-notebook" })}>
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4" />
            New notebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialog({ kind: "rename-shelf" })}>
            <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} className="size-4" />
            Rename library
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDialog({ kind: "delete-shelf" })}
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
            Delete library
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div
        className={`grid transition-[grid-template-rows] duration-100 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
        <SidebarMenuSub>
          {notebooksQuery.data?.map((nb) => (
            <SidebarMenuSubItem key={nb.id} className="group/notebook">
              <SidebarMenuSubButton
                isActive={
                  pathname === `/notebook/${nb.id}` ||
                  pathname.startsWith(`/notebook/${nb.id}/`)
                }
                className="pr-8"
                render={
                  <Link href={`/notebook/${nb.id}`}>
                    <span className="truncate">{nb.title}</span>
                  </Link>
                }
              />
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      aria-label={`Actions for ${nb.title}`}
                      className="absolute end-1 top-1/2 -translate-y-1/2 rounded-md p-1 text-sidebar-foreground/60 opacity-0 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:opacity-100 group-hover/notebook:opacity-100"
                    >
                      <HugeiconsIcon
                        icon={MoreHorizontalIcon}
                        strokeWidth={2}
                        className="size-3.5"
                      />
                    </button>
                  }
                />
                <DropdownMenuContent side="right" align="start">
                  <DropdownMenuItem
                    onClick={() =>
                      setDialog({
                        kind: "rename-notebook",
                        id: nb.id,
                        title: nb.title,
                      })
                    }
                  >
                    <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} className="size-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() =>
                      setDialog({
                        kind: "delete-notebook",
                        id: nb.id,
                        title: nb.title,
                      })
                    }
                  >
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuSubItem>
          ))}
          {notebooksQuery.data?.length === 0 && (
            <SidebarMenuSubItem>
              <span className="px-2 py-1 text-xs text-sidebar-foreground/60">
                No notebooks
              </span>
            </SidebarMenuSubItem>
          )}
        </SidebarMenuSub>
        </div>
      </div>

      <PromptDialog
        open={dialog.kind === "rename-shelf"}
        onOpenChange={(v) => !v && close()}
        title="Rename library"
        label="Library name"
        defaultValue={shelf.name}
        confirmLabel="Rename"
        onSubmit={(name) => renameShelf.mutateAsync({ id: shelf.id, name })}
      />

      <PromptDialog
        open={dialog.kind === "create-notebook"}
        onOpenChange={(v) => !v && close()}
        title="New notebook"
        description={`Create a notebook in ${shelf.name}`}
        label="Title"
        placeholder="Untitled"
        defaultValue=""
        confirmLabel="Create"
        onSubmit={async (title) => {
          await createNotebook.mutateAsync({
            shelfId: shelf.id,
            title,
            language: defaultLanguage,
          })
          setOpen(true)
        }}
      />

      <PromptDialog
        open={dialog.kind === "rename-notebook"}
        onOpenChange={(v) => !v && close()}
        title="Rename notebook"
        label="Title"
        defaultValue={dialog.kind === "rename-notebook" ? dialog.title : ""}
        confirmLabel="Rename"
        onSubmit={(title) => {
          if (dialog.kind !== "rename-notebook") return
          return renameNotebook.mutateAsync({ id: dialog.id, title })
        }}
      />

      <ConfirmDialog
        open={dialog.kind === "delete-shelf"}
        onOpenChange={(v) => !v && close()}
        title={`Delete ${shelf.name}?`}
        description="All notebooks inside will be deleted. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleteShelf.mutateAsync(shelf.id)}
      />

      <ConfirmDialog
        open={dialog.kind === "delete-notebook"}
        onOpenChange={(v) => !v && close()}
        title={
          dialog.kind === "delete-notebook"
            ? `Delete ${dialog.title}?`
            : "Delete notebook?"
        }
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (dialog.kind !== "delete-notebook") return
          return deleteNotebook.mutateAsync({ id: dialog.id, shelfId: shelf.id })
        }}
      />
    </SidebarMenuItem>
  )
}
