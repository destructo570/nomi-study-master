"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { BubbleChatIcon, PlusSignIcon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"

import { useStandaloneChatSessions } from "@/lib/hooks/use-chats"

export default function AllChatsPage() {
  const chatsQuery = useStandaloneChatSessions()
  const chats = chatsQuery.data ?? []

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-6 py-10 sm:px-8">
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-light tracking-tight">
            My Chats
          </h1>
        </div>
        <Button
          size="sm"
          render={
            <Link href="/chat">
              <HugeiconsIcon
                icon={PlusSignIcon}
                strokeWidth={2}
                className="size-4"
              />
              New chat
            </Link>
          }
        />
      </header>

      {chats.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No chats yet. Start one from the home page or use the button above.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {chats.map((chat) => (
            <li key={chat.id}>
              <Link
                href={`/chat/${chat.id}`}
                className="flex items-start gap-3 px-4 py-3 transition hover:bg-accent/40"
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
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
                  <div className="line-clamp-1 text-xs text-muted-foreground">
                    {chat.preview?.trim() || "No messages yet."}
                  </div>
                </div>
                <div className="shrink-0 text-[11px] text-muted-foreground">
                  {formatRelative(chat.updatedAt)}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
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
