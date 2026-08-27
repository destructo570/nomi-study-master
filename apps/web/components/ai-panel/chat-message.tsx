"use client"

import { useState } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import rehypeKatex from "rehype-katex"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, Copy01Icon } from "@hugeicons/core-free-icons"

import type { ChatMessage } from "@workspace/types"

import { normalizeMathDelimiters } from "./normalize-math"

export type ChatUiMessage = ChatMessage

type ChatMessageProps = {
  message: ChatUiMessage
  isStreaming?: boolean
  streamingChunks?: string[]
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

const markdownComponents: Components = {
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => <h1 className="mt-3 mb-2 text-base font-semibold">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-3 mb-2 text-sm font-semibold">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-2 mb-1 text-sm font-semibold">{children}</h3>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline underline-offset-2 hover:text-foreground"
    >
      {children}
    </a>
  ),
  code: ({ className, children }) => {
    const isBlock = /language-/.test(className ?? "")
    if (isBlock) {
      return (
        <code className={className}>{children}</code>
      )
    }
    return (
      <code className="rounded bg-muted px-1 py-0.5 text-[0.85em] font-mono [overflow-wrap:anywhere]">
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs leading-relaxed">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-border pl-3 text-muted-foreground">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-border" />,
}

export function ChatMessageItem({
  message,
  isStreaming,
  streamingChunks,
}: ChatMessageProps) {
  if (message.role === "user") {
    const fullDate = new Date(message.createdAt).toLocaleString()
    const relative = formatRelative(message.createdAt)
    return (
      <div className="group flex flex-col items-end">
        <div
          className="max-w-[85%] whitespace-pre-wrap rounded-lg rounded-br-sm bg-accent px-3 py-2 text-sm leading-relaxed text-accent-foreground"
          title={fullDate}
        >
          {message.content}
        </div>
        <span
          className="mt-1 text-[10px] text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100"
          title={fullDate}
        >
          {relative}
        </span>
      </div>
    )
  }
  const streamingContent =
    isStreaming && streamingChunks && streamingChunks.length > 0
      ? streamingChunks.join("")
      : null

  const isStreamingNow = streamingContent !== null

  return (
    <AssistantMessage
      content={message.content}
      streamingContent={streamingContent}
      isStreamingNow={isStreamingNow}
    />
  )
}

function AssistantMessage({
  content,
  streamingContent,
  isStreamingNow,
}: {
  content: string
  streamingContent: string | null
  isStreamingNow: boolean
}) {
  const [copied, setCopied] = useState(false)

  // LLMs frequently emit LaTeX with \(...\) / \[...\] delimiters, which
  // remark-math can't parse. Normalize them to $...$ / $$...$$ before
  // rendering so math renders regardless of which style the model used.
  const rendered = normalizeMathDelimiters(streamingContent ?? content)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Couldn't copy - try again")
    }
  }

  return (
    <div className="group w-full">
      <div
        className={`text-sm leading-relaxed text-foreground${
          isStreamingNow ? " chat-stream-md" : ""
        }`}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={markdownComponents}
        >
          {rendered}
        </ReactMarkdown>
      </div>
      <div
        aria-hidden={isStreamingNow}
        className={`mt-1 flex h-7 items-center justify-end gap-1 transition-opacity ${
          isStreamingNow ? "opacity-0" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
        }`}
      >
        <button
          type="button"
          onClick={handleCopy}
          disabled={isStreamingNow}
          aria-label={copied ? "Copied" : "Copy message"}
          title={copied ? "Copied" : "Copy"}
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none"
        >
          <HugeiconsIcon
            icon={copied ? CheckmarkCircle02Icon : Copy01Icon}
            strokeWidth={2}
            className="size-3.5"
          />
        </button>
      </div>
    </div>
  )
}
