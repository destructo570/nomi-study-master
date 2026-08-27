"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Textarea } from "@workspace/ui/components/textarea"
import { Button } from "@workspace/ui/components/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Edit02Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"

import type { Chapter } from "@workspace/types"

type ChapterViewProps = {
  chapter: Chapter
  onChangeTitle: (title: string) => void
  onChangeMarkdown: (markdown: string) => void
}

export function ChapterView({
  chapter,
  onChangeTitle,
  onChangeMarkdown,
}: ChapterViewProps) {
  const [title, setTitle] = useState(chapter.title)
  const [markdown, setMarkdown] = useState(chapter.markdown)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    setTitle(chapter.title)
    setMarkdown(chapter.markdown)
  }, [chapter.id])

  function commitTitle() {
    const trimmed = title.trim()
    if (!trimmed || trimmed === chapter.title) {
      setTitle(chapter.title)
      return
    }
    onChangeTitle(trimmed)
  }

  function commitMarkdown() {
    if (markdown === chapter.markdown) return
    onChangeMarkdown(markdown)
  }

  return (
    <div className="min-w-0 flex-1 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              ;(e.currentTarget as HTMLInputElement).blur()
            }
            if (e.key === "Escape") {
              setTitle(chapter.title)
              ;(e.currentTarget as HTMLInputElement).blur()
            }
          }}
          className="w-full bg-transparent text-3xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/40"
          placeholder="Chapter title"
          aria-label="Chapter title"
        />
        <Button
          type="button"
          variant={editing ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            if (editing) commitMarkdown()
            setEditing((e) => !e)
          }}
        >
          <HugeiconsIcon
            icon={editing ? CheckmarkCircle02Icon : Edit02Icon}
            strokeWidth={2}
            className="size-4"
          />
          {editing ? "Done" : "Edit"}
        </Button>
      </div>

      {editing ? (
        <Textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          rows={24}
          className="font-mono text-sm leading-6"
          aria-label="Chapter markdown"
        />
      ) : (
        <article className="notebook-markdown max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ node: _node, ...props }) => (
                <h1 className="mt-8 mb-3 text-2xl font-semibold tracking-tight first:mt-0" {...props} />
              ),
              h2: ({ node: _node, ...props }) => (
                <h2 className="mt-7 mb-2 text-xl font-semibold tracking-tight" {...props} />
              ),
              h3: ({ node: _node, ...props }) => (
                <h3 className="mt-6 mb-2 text-base font-semibold" {...props} />
              ),
              p: ({ node: _node, ...props }) => (
                <p className="my-3 text-sm leading-7 text-foreground/90" {...props} />
              ),
              ul: ({ node: _node, ...props }) => (
                <ul className="my-3 ml-5 list-disc space-y-1 text-sm leading-7" {...props} />
              ),
              ol: ({ node: _node, ...props }) => (
                <ol className="my-3 ml-5 list-decimal space-y-1 text-sm leading-7" {...props} />
              ),
              li: ({ node: _node, ...props }) => (
                <li className="pl-1" {...props} />
              ),
              blockquote: ({ node: _node, ...props }) => (
                <blockquote className="my-4 border-l-2 border-primary/40 bg-muted/40 px-4 py-2 text-sm italic text-muted-foreground" {...props} />
              ),
              code: ({ node: _node, className, children, ...props }) => {
                const isBlock = className?.includes("language-")
                if (isBlock) {
                  return (
                    <code className="font-mono text-[12.5px]" {...props}>
                      {children}
                    </code>
                  )
                }
                return (
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[12.5px]" {...props}>
                    {children}
                  </code>
                )
              },
              pre: ({ node: _node, ...props }) => (
                <pre className="my-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm leading-6" {...props} />
              ),
              a: ({ node: _node, ...props }) => (
                <a className="font-medium text-primary underline underline-offset-2 hover:text-primary/80" {...props} />
              ),
              table: ({ node: _node, ...props }) => (
                <div className="my-4 overflow-x-auto">
                  <table className="w-full text-sm" {...props} />
                </div>
              ),
              th: ({ node: _node, ...props }) => (
                <th className="border-b border-border px-3 py-2 text-left font-medium" {...props} />
              ),
              td: ({ node: _node, ...props }) => (
                <td className="border-b border-border/60 px-3 py-2" {...props} />
              ),
              hr: ({ node: _node, ...props }) => (
                <hr className="my-6 border-border" {...props} />
              ),
            }}
          >
            {markdown}
          </ReactMarkdown>
        </article>
      )}
    </div>
  )
}
