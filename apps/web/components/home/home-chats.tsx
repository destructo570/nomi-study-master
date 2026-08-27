"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { BubbleChatIcon } from "@hugeicons/core-free-icons"

import { useStandaloneChatSessions } from "@/lib/hooks/use-chats"

const HOME_CHATS_LIMIT = 4

export function HomeChats() {
  const chatsQuery = useStandaloneChatSessions()
  const chats = (chatsQuery.data ?? []).slice(0, HOME_CHATS_LIMIT)

  if (chats.length === 0) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">Recent chats</h2>
        <Link
          href="/chats"
          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {chats.map((chat) => (
          <Link
            key={chat.id}
            href={`/chat/${chat.id}`}
            className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-foreground/25 hover:shadow-hairline"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <HugeiconsIcon
                icon={BubbleChatIcon}
                strokeWidth={2}
                className="size-4"
              />
            </span>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="line-clamp-1 text-sm font-medium text-foreground">
                {chat.title?.trim() || "Untitled chat"}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatRelative(chat.updatedAt)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
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
