"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BubbleChatIcon,
  Delete02Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { api } from "@/lib/api"
import { qk } from "@/lib/query-keys"
import type { ChatSessionSummary } from "@workspace/types"

type SidebarChatItemProps = {
  chat: ChatSessionSummary
}

export function SidebarChatItem({ chat }: SidebarChatItemProps) {
  const pathname = usePathname()
  const router = useRouter()
  const qc = useQueryClient()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isActive = pathname === `/chat/${chat.id}`
  const title = chat.title?.trim() || "Untitled chat"

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteChatSession(chat.id),
    onSuccess: () => {
      qc.setQueryData<ChatSessionSummary[] | undefined>(
        qk.standaloneChatSessions(),
        (prev) => prev?.filter((s) => s.id !== chat.id),
      )
      qc.removeQueries({ queryKey: qk.chatSession(chat.id) })
      setConfirmOpen(false)
      // If the user was viewing the chat we just deleted, kick them to a
      // fresh new-chat page so they don't sit on a broken session.
      if (isActive) router.replace("/chat")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete chat")
    },
  })

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={title}
        render={
          <Link href={`/chat/${chat.id}`}>
            <HugeiconsIcon
              icon={BubbleChatIcon}
              strokeWidth={2}
              className="size-4"
            />
            <span className="truncate">{title}</span>
          </Link>
        }
      />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuAction
              showOnHover
              aria-label={`Actions for ${title}`}
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
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <HugeiconsIcon
              icon={Delete02Icon}
              strokeWidth={2}
              className="size-4"
            />
            Delete chat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(v) => !deleteMutation.isPending && setConfirmOpen(v)}
        title={`Delete "${title}"?`}
        description="This chat and all its messages will be permanently removed."
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleteMutation.mutateAsync()}
      />
    </SidebarMenuItem>
  )
}
