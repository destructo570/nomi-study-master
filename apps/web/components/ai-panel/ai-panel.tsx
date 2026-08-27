"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import posthog from "posthog-js"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  Cancel01Icon,
  Delete02Icon,
  FullscreenIcon,
  PanelLeftIcon,
  PlusSignIcon,
  SentIcon,
  SquareArrowShrink01Icon,
  StopCircleIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { useSidebar } from "@workspace/ui/components/sidebar"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"

import { ArkiveLogo } from "@/components/app-sidebar"

import { ConfirmDialog } from "@/components/confirm-dialog"

import { nanoid } from "nanoid"
import { useNotebook } from "@/lib/hooks/use-workspace"
import { api } from "@/lib/api"
import { qk } from "@/lib/query-keys"
import { triggerUpgradeModal } from "@/lib/upgrade-trigger"
import type { ChatSessionSummary } from "@workspace/types"

import { ChatHistoryDropdown } from "./chat-history-dropdown"
import { ChatMessageItem, type ChatUiMessage } from "./chat-message"
import { ADD_TO_CHAT_EVENT, type AddToChatDetail } from "./selection-to-chat"
import { TutorToggle } from "./tutor-toggle"

type AiPanelProps = {
  /** When omitted, the panel runs in standalone "My Chats" mode. */
  notebookId?: string | null
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  /** Existing standalone session to resume on mount (standalone mode only). */
  initialSessionId?: string | null
  /** Initial message to auto-send on first render (standalone mode only). */
  initialUserMessage?: string | null
  /** Notified after a new session id is assigned by the server. */
  onSessionCreated?: (sessionId: string) => void
}

type ContextChip = { id: string; text: string }

const BOTTOM_BUFFER_DEFAULT = 40
const BOTTOM_BUFFER_STREAMING = 140

export function AiPanel({
  notebookId,
  isFullscreen,
  onToggleFullscreen,
  initialSessionId,
  initialUserMessage,
  onSessionCreated,
}: AiPanelProps) {
  const isStandalone = !notebookId
  const notebookQuery = useNotebook(notebookId ?? "")
  const queryClient = useQueryClient()
  const router = useRouter()
  const sidebar = useSidebar()
  const sidebarCollapsed = sidebar.state === "collapsed"
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePending, setDeletePending] = useState(false)

  const sessionsQuery = useQuery({
    queryKey: isStandalone
      ? qk.standaloneChatSessions()
      : qk.chatSessions(notebookId as string),
    queryFn: () =>
      isStandalone
        ? api.listStandaloneChatSessions()
        : api.listChatSessions(notebookId as string),
  })

  const [messages, setMessages] = useState<ChatUiMessage[]>([])
  const [input, setInput] = useState("")
  const [chips, setChips] = useState<ContextChip[]>([])
  const [chatPending, setChatPending] = useState(false)
  const [streamingChunks, setStreamingChunks] = useState<string[]>([])
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null)
  const [loadingSession, setLoadingSession] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    initialSessionId ?? null,
  )
  const [bottomBuffer, setBottomBuffer] = useState(BOTTOM_BUFFER_DEFAULT)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const scrollHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevMessageCountRef = useRef(0)
  const autoSentRef = useRef(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const lengthChanged = messages.length !== prevMessageCountRef.current
    prevMessageCountRef.current = messages.length
    if (!lengthChanged) return
    const last = messages[messages.length - 1]
    if (last?.role !== "user") return
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    // Reset panel state when the user navigates to a different notebook.
    if (isStandalone) return
    setMessages([])
    setCurrentSessionId(null)
    setChips([])
    setInput("")
    setBottomBuffer(BOTTOM_BUFFER_DEFAULT)
  }, [notebookId, isStandalone])

  useEffect(() => {
    return () => {
      if (scrollHideTimer.current) clearTimeout(scrollHideTimer.current)
    }
  }, [])

  // Standalone: load existing session messages on mount when initialSessionId is set.
  useEffect(() => {
    if (!isStandalone) return
    if (!initialSessionId) return
    let cancelled = false
    setLoadingSession(true)
    queryClient
      .fetchQuery({
        queryKey: qk.chatSession(initialSessionId),
        queryFn: () => api.getChatSession(initialSessionId),
      })
      .then((session) => {
        if (cancelled) return
        setMessages(session.messages)
        setCurrentSessionId(session.id)
      })
      .catch((err) => {
        if (cancelled) return
        toast.error(err instanceof Error ? err.message : "Failed to load chat")
      })
      .finally(() => {
        if (!cancelled) setLoadingSession(false)
      })
    return () => {
      cancelled = true
    }
  }, [initialSessionId, isStandalone, queryClient])

  function handleScroll() {
    setIsScrolling(true)
    if (scrollHideTimer.current) clearTimeout(scrollHideTimer.current)
    scrollHideTimer.current = setTimeout(() => setIsScrolling(false), 2000)
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollToBottom(distanceFromBottom > 80)
  }

  function scrollToBottom() {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }

  useEffect(() => {
    function handleAdd(e: Event) {
      const detail = (e as CustomEvent<AddToChatDetail>).detail
      if (!detail?.text) return
      setChips((prev) => [...prev, { id: nanoid(6), text: detail.text }])
      textareaRef.current?.focus()
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.altKey || e.shiftKey) return
      if (e.key.toLowerCase() !== "l") return
      const target = e.target
      if (target === textareaRef.current) return
      e.preventDefault()
      textareaRef.current?.focus()
    }
    window.addEventListener(ADD_TO_CHAT_EVENT, handleAdd as EventListener)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener(ADD_TO_CHAT_EVENT, handleAdd as EventListener)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const ready = isStandalone ? true : !!notebookQuery.data
  const pending = chatPending

  function pushUser(content: string): ChatUiMessage {
    const msg: ChatUiMessage = {
      id: nanoid(6),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    }
    setMessages((m) => [...m, msg])
    return msg
  }

  async function refreshSessionsUntilTitled(targetSessionId: string | null) {
    const delays = [0, 600, 1000, 1500, 2500, 4000]
    const queryKey = isStandalone
      ? qk.standaloneChatSessions()
      : qk.chatSessions(notebookId as string)
    for (const delay of delays) {
      if (delay > 0) await new Promise((r) => setTimeout(r, delay))
      await queryClient.invalidateQueries({ queryKey })
      if (!targetSessionId) return
      const sessions =
        queryClient.getQueryData<ChatSessionSummary[]>(queryKey)
      const session = sessions?.find((s) => s.id === targetSessionId)
      if (session?.title && session.title.trim().length > 0) return
    }
  }

  async function streamChat(
    userMessage: ChatUiMessage,
    chipTexts: string[],
  ) {
    const assistantId = nanoid(6)
    let assistantInserted = false
    const upsertAssistant = (content: string) => {
      if (!assistantInserted) {
        assistantInserted = true
        setMessages((m) => [
          ...m,
          {
            id: assistantId,
            role: "assistant",
            content,
            createdAt: new Date().toISOString(),
          },
        ])
      } else {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId ? { ...msg, content } : msg,
          ),
        )
      }
    }

    setChatPending(true)
    setStreamingChunks([])
    setStreamingMsgId(assistantId)
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001"
      const url = isStandalone
        ? `${API_BASE_URL}/api/chat/sessions/stream`
        : `${API_BASE_URL}/api/notebooks/${notebookId}/chat/stream`
      const requestBody = isStandalone
        ? {
            sessionId: currentSessionId,
            userMessage: userMessage.content,
          }
        : {
            sessionId: currentSessionId,
            userMessage: userMessage.content,
            context: chipTexts,
          }

      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(requestBody),
      })

      if (!res.ok) {
        let detail = `HTTP ${res.status}`
        let errorCode: string | undefined
        let action: string | undefined
        try {
          const body = (await res.json()) as {
            error?: string
            message?: string
            action?: string
          }
          if (body.message) detail = body.message
          else if (body.error) detail = body.error
          errorCode = body.error
          action = body.action
        } catch {
          // non-JSON body - keep default
        }
        if (res.status === 429 && errorCode === "quota_exceeded") {
          triggerUpgradeModal({ kind: "quota_exceeded", action })
        }
        throw new Error(detail)
      }

      const returnedSessionId = res.headers.get("X-Session-Id")
      if (returnedSessionId && !currentSessionId) {
        setCurrentSessionId(returnedSessionId)
        onSessionCreated?.(returnedSessionId)
      }

      if (!res.body) throw new Error("Empty response")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        if (!chunk) continue
        acc += chunk
        setStreamingChunks((prev) => [...prev, chunk])
        upsertAssistant(acc)
      }
      const tail = decoder.decode()
      if (tail) {
        acc += tail
        setStreamingChunks((prev) => [...prev, tail])
        upsertAssistant(acc)
      }

      const targetSessionId = returnedSessionId ?? currentSessionId
      void refreshSessionsUntilTitled(targetSessionId)
    } catch (err) {
      if (controller.signal.aborted) return
      const text = err instanceof Error ? err.message : "Chat failed"
      toast.error(text)
      upsertAssistant(`Error: ${text}`)
    } finally {
      abortRef.current = null
      setChatPending(false)
      setStreamingMsgId(null)
      setStreamingChunks([])
      setBottomBuffer(BOTTOM_BUFFER_DEFAULT)
    }
  }

  async function sendMessage(text: string, chipTexts: string[]) {
    const userEcho = chipTexts.length
      ? `${chipTexts.map((c) => `> ${c}`).join("\n\n")}\n\n${text}`.trim()
      : text
    if (!userEcho) return
    posthog.capture("chat_message_sent", {
      surface: isStandalone ? "standalone" : "notebook",
      notebook_id: notebookId ?? null,
      session_id: currentSessionId,
      is_new_session: !currentSessionId,
      context_chips: chipTexts.length,
      message_length: text.length,
    })
    setBottomBuffer(BOTTOM_BUFFER_STREAMING)
    const userMsg = pushUser(userEcho)
    await streamChat(userMsg, chipTexts)
  }

  // Standalone: auto-send the initial message exactly once.
  useEffect(() => {
    if (!isStandalone) return
    if (!initialUserMessage) return
    if (autoSentRef.current) return
    if (initialSessionId) return
    autoSentRef.current = true
    void sendMessage(initialUserMessage, [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStandalone, initialUserMessage, initialSessionId])

  async function openSession(sessionId: string) {
    if (sessionId === currentSessionId) return
    const hasDraft = input.trim().length > 0 || chips.length > 0
    if (hasDraft) {
      const ok = window.confirm(
        "Discard your draft message and switch chats?",
      )
      if (!ok) return
    }
    abortRef.current?.abort()
    setMessages([])
    setCurrentSessionId(sessionId)
    setChips([])
    setInput("")
    setBottomBuffer(BOTTOM_BUFFER_DEFAULT)
    setLoadingSession(true)
    try {
      const session = await queryClient.fetchQuery({
        queryKey: qk.chatSession(sessionId),
        queryFn: () => api.getChatSession(sessionId),
      })
      setMessages(session.messages)
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to load chat"
      toast.error(text)
    } finally {
      setLoadingSession(false)
    }
  }

  function handleNewChat() {
    abortRef.current?.abort()
    setMessages([])
    setCurrentSessionId(null)
    setChips([])
    setInput("")
    setBottomBuffer(BOTTOM_BUFFER_DEFAULT)
  }

  async function handleDeleteCurrent() {
    if (!currentSessionId) return
    setDeletePending(true)
    try {
      abortRef.current?.abort()
      const idToDelete = currentSessionId
      await api.deleteChatSession(idToDelete)
      queryClient.removeQueries({ queryKey: qk.chatSession(idToDelete) })
      const listKey = isStandalone
        ? qk.standaloneChatSessions()
        : qk.chatSessions(notebookId as string)
      queryClient.setQueryData<ChatSessionSummary[] | undefined>(
        listKey,
        (prev) => prev?.filter((s) => s.id !== idToDelete),
      )
      handleNewChat()
      setDeleteOpen(false)
      // Standalone deep-link: send the user back to the new-chat URL so
      // they don't sit on /chat/<deletedId>.
      if (isStandalone && typeof window !== "undefined") {
        if (window.location.pathname.startsWith("/chat/")) {
          router.replace("/chat")
        }
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete chat",
      )
    } finally {
      setDeletePending(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending || !ready) return
    const text = input.trim()
    if (!text && chips.length === 0) return

    const chipTexts = chips.map((c) => c.text)
    setInput("")
    setChips([])
    textareaRef.current?.focus()
    await sendMessage(text, chipTexts)
  }

  const placeholder =
    chips.length > 0
      ? "Ask about the quoted text…"
      : isStandalone
        ? "Ask anything…"
        : "Ask about this notebook…"

  const submitDisabled =
    (!input.trim() && chips.length === 0) || pending || !ready

  const hasConversations =
    messages.length > 0 || (sessionsQuery.data?.length ?? 0) > 0

  const headerLabel = "Chat"
  const emptyHint = isStandalone
    ? "Ask anything - fenn is here to help you learn."
    : "Ask anything about this notebook.\nSelect text in any tab to quote it here."

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-background">
      <header className="flex w-full items-center gap-1 px-2 py-2">
        {isStandalone && sidebarCollapsed && (
          <button
            type="button"
            onClick={sidebar.toggleSidebar}
            aria-label="Open sidebar"
            className="group relative ml-2 flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ArkiveLogo className="size-7 text-foreground transition-opacity duration-150 group-hover:opacity-0" />
            <HugeiconsIcon
              icon={PanelLeftIcon}
              strokeWidth={2}
              className="absolute size-4 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
            />
          </button>
        )}
        <span
          className={cn(
            "text-lg font-medium",
            isStandalone && sidebarCollapsed ? "pl-1" : "pl-2",
          )}
        >
          {headerLabel}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {!isStandalone && (
            <TutorToggle
              notebookId={notebookId as string}
              value={notebookQuery.data?.tutorPreset ?? null}
              disabled={!ready}
            />
          )}
          {currentSessionId && (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              aria-label="Delete this chat"
              title="Delete this chat"
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
            >
              <HugeiconsIcon
                icon={Delete02Icon}
                strokeWidth={2}
                className="size-4"
              />
            </button>
          )}
          {hasConversations && (
            <button
              type="button"
              onClick={handleNewChat}
              aria-label="Start a new chat"
              title="Start a new chat"
              className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <HugeiconsIcon
                icon={PlusSignIcon}
                strokeWidth={2}
                className="size-3.5"
              />
              New
            </button>
          )}
          {!isStandalone && (
            <ChatHistoryDropdown
              notebookId={notebookId ?? null}
              currentSessionId={currentSessionId}
              onOpen={(id) => {
                void openSession(id)
              }}
              onAfterDelete={(deletedId) => {
                if (deletedId === currentSessionId) handleNewChat()
              }}
            />
          )}
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Expand chat"}
              title={isFullscreen ? "Exit fullscreen" : "Expand chat"}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <HugeiconsIcon
                icon={isFullscreen ? SquareArrowShrink01Icon : FullscreenIcon}
                strokeWidth={2}
                className="size-4"
              />
            </button>
          )}
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          data-scrolling={isScrolling ? "true" : "false"}
          className={cn(
            "flex-1 min-h-0 overflow-y-auto",
            "[scrollbar-width:thin] [scrollbar-color:transparent_transparent]",
            "[&::-webkit-scrollbar]:w-1.5",
            "[&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent [&::-webkit-scrollbar-thumb]:transition-colors",
            "data-[scrolling=true]:[scrollbar-color:var(--border)_transparent]",
            "data-[scrolling=true]:[&::-webkit-scrollbar-thumb]:bg-border",
          )}
        >
          <div
            className="mx-auto w-full max-w-[720px] space-y-4 px-2 pt-4"
            style={{ paddingBottom: bottomBuffer }}
          >
            {loadingSession ? (
              <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                Loading chat…
              </div>
            ) : (
              <>
                {messages.length === 0 && (
                  <div className="rounded-2xl border border-dashed bg-muted/50 p-5 text-center text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
                    {emptyHint}
                  </div>
                )}
                {messages.map((m, i) => {
                  const isLast = i === messages.length - 1
                  const isStreaming =
                    chatPending && isLast && m.role === "assistant"
                  return (
                    <ChatMessageItem
                      key={m.id}
                      message={m}
                      isStreaming={isStreaming}
                      streamingChunks={
                        isStreaming && m.id === streamingMsgId
                          ? streamingChunks
                          : undefined
                      }
                    />
                  )
                })}
                {pending &&
                  (messages.length === 0 ||
                    messages[messages.length - 1]!.role === "user") && (
                    <div className="text-shimmer text-xs">Thinking…</div>
                  )}
              </>
            )}
          </div>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background to-transparent"
        />
        {showScrollToBottom && (
          <button
            type="button"
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
            title="Scroll to bottom"
            className="absolute bottom-3 left-1/2 z-10 flex size-8 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-md transition-colors hover:text-foreground"
          >
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={2}
              className="size-4"
            />
          </button>
        )}
      </div>

      <div className="mx-auto w-full max-w-[720px] p-3 md:px-2 md:pb-1">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 rounded-3xl border border-border bg-background p-2 transition-[border-color] focus-within:border-foreground/25"
        >
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-1 pt-1">
              {chips.map((chip) => (
                <ContextChipView
                  key={chip.id}
                  chip={chip}
                  onRemove={() =>
                    setChips((prev) => prev.filter((c) => c.id !== chip.id))
                  }
                />
              ))}
            </div>
          )}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault()
                handleSubmit(e as unknown as React.FormEvent)
              }
            }}
            placeholder={placeholder}
            rows={1}
            className="max-h-[240px] min-h-11 resize-none rounded-none border-0 bg-transparent px-2 py-2 text-sm shadow-none placeholder:text-muted-foreground/70 focus-visible:border-0 focus-visible:ring-0"
          />
          <div className="flex items-center gap-1.5">
            <div className="flex flex-1 flex-wrap items-center gap-1" />
            {chatPending ? (
              <Button
                type="button"
                size="icon-sm"
                onClick={() => abortRef.current?.abort()}
                className="shrink-0"
                aria-label="Stop generating"
                title="Stop generating"
              >
                <HugeiconsIcon
                  icon={StopCircleIcon}
                  strokeWidth={2}
                  className="size-4"
                />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon-sm"
                disabled={submitDisabled}
                className="shrink-0"
                aria-label="Send"
              >
                <HugeiconsIcon
                  icon={SentIcon}
                  strokeWidth={2}
                  className="size-4"
                />
              </Button>
            )}
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(v) => !deletePending && setDeleteOpen(v)}
        title="Delete this chat?"
        description="This chat and all its messages will be permanently removed."
        confirmLabel={deletePending ? "Deleting…" : "Delete"}
        destructive
        onConfirm={handleDeleteCurrent}
      />
    </div>
  )
}

function ContextChipView({
  chip,
  onRemove,
}: {
  chip: ContextChip
  onRemove: () => void
}) {
  const preview =
    chip.text.length > 80 ? chip.text.slice(0, 80).trimEnd() + "…" : chip.text
  return (
    <div
      className="group flex max-w-full items-center gap-1.5 rounded-md border border-border/70 bg-muted/50 py-1 pr-1 pl-2 text-xs"
      title={chip.text}
    >
      <span className="size-1 shrink-0 rounded-full bg-foreground/60" />
      <span className="min-w-0 truncate text-foreground/80">{preview}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove context"
        className="flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-background hover:text-foreground"
      >
        <HugeiconsIcon
          icon={Cancel01Icon}
          strokeWidth={2}
          className="size-3"
        />
      </button>
    </div>
  )
}
