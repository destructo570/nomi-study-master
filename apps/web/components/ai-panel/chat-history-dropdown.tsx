"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import { Clock04Icon, Delete02Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"

import { api } from "@/lib/api"
import { qk } from "@/lib/query-keys"
import type { ChatSessionSummary } from "@workspace/types"

type ChatHistoryDropdownProps = {
  notebookId: string | null
  currentSessionId: string | null
  onOpen: (sessionId: string) => void
  onAfterDelete?: (deletedSessionId: string) => void
}

function formatRelative(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = Math.max(0, now - then)
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export function ChatHistoryDropdown({
  notebookId,
  currentSessionId,
  onOpen,
  onAfterDelete,
}: ChatHistoryDropdownProps) {
  const qc = useQueryClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<ChatSessionSummary | null>(
    null,
  )

  const listKey = notebookId
    ? qk.chatSessions(notebookId)
    : qk.standaloneChatSessions()

  const sessionsQuery = useQuery({
    queryKey: listKey,
    queryFn: () =>
      notebookId
        ? api.listChatSessions(notebookId)
        : api.listStandaloneChatSessions(),
  })

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => api.deleteChatSession(sessionId),
    onSuccess: (_void, sessionId) => {
      qc.setQueryData<ChatSessionSummary[] | undefined>(listKey, (prev) =>
        prev?.filter((s) => s.id !== sessionId),
      )
      qc.removeQueries({ queryKey: qk.chatSession(sessionId) })
      onAfterDelete?.(sessionId)
      setPendingDelete(null)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete chat")
    },
  })

  const sessions = sessionsQuery.data ?? []

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="Chat history"
              title="Chat history"
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <HugeiconsIcon
                icon={Clock04Icon}
                strokeWidth={2}
                className="size-4"
              />
            </button>
          }
        />
        <DropdownMenuContent align="end" className="w-64 p-1.5">
          {sessionsQuery.isLoading ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Loading…
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              No saved chats yet.
            </div>
          ) : (
            <div className="flex flex-col">
              {sessions.map((s) => (
                <HistoryItem
                  key={s.id}
                  session={s}
                  active={s.id === currentSessionId}
                  onOpen={() => {
                    onOpen(s.id)
                    setMenuOpen(false)
                  }}
                  onRequestDelete={() => setPendingDelete(s)}
                />
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setPendingDelete(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this chat?</DialogTitle>
            <DialogDescription>
              {`"${pendingDelete?.title?.trim() || "Untitled chat"}" and all its messages will be permanently removed. This can't be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPendingDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() =>
                pendingDelete && deleteMutation.mutate(pendingDelete.id)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function HistoryItem({
  session,
  active,
  onOpen,
  onRequestDelete,
}: {
  session: ChatSessionSummary
  active: boolean
  onOpen: () => void
  onRequestDelete: () => void
}) {
  const title = useMemo(
    () => session.title?.trim() || "Untitled chat",
    [session.title],
  )
  const date = useMemo(
    () => formatRelative(session.updatedAt),
    [session.updatedAt],
  )
  return (
    <div
      className={cn(
        "group/item flex items-center gap-1 rounded-[6px] px-2 py-1.5",
        active ? "bg-accent/60" : "hover:bg-accent/60",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 flex-col items-start text-left"
      >
        <span className="max-w-full truncate text-sm font-medium text-foreground">
          {title}
        </span>
        <span className="text-[11px] text-muted-foreground">{date}</span>
      </button>
      <button
        type="button"
        aria-label="Delete chat"
        title="Delete chat"
        onClick={(e) => {
          e.stopPropagation()
          onRequestDelete()
        }}
        className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition hover:bg-background hover:text-destructive group-hover/item:opacity-100 focus-visible:opacity-100"
      >
        <HugeiconsIcon
          icon={Delete02Icon}
          strokeWidth={2}
          className="size-3.5"
        />
      </button>
    </div>
  )
}
