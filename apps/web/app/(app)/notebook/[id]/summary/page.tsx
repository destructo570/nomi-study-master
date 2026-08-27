"use client"

import { use, useEffect, useMemo, useRef, useState } from "react"
import { migrateMathStrings } from "@tiptap/extension-mathematics"
import Placeholder from "@tiptap/extension-placeholder"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { marked } from "marked"
import TurndownService from "turndown"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  MagicWand01Icon,
  ParagraphBulletsPoint01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import {
  type LanguageCode,
  normalizeLanguage,
} from "@workspace/types/language"

import { GenerateSummaryDialog } from "@/components/notebook/generate-summary-dialog"
import {
  ArtifactLanguageSwitcher,
  pickInitialLanguage,
} from "@/components/notebook/artifact-language-switcher"
import {
  NoSourceTooltip,
  useHasNoSource,
} from "@/components/notebook/generate-button-guard"
import { CalloutExtension } from "@/components/editor/extensions/callout"
import { CodeBlockExtension } from "@/components/editor/extensions/code-block"
import { createMathematicsExtension } from "@/components/editor/extensions/math"
import { SlashCommandExtension } from "@/components/editor/extensions/slash-command"
import { slashItems } from "@/components/editor/slash-items"
import {
  useDebouncedSaveSummary,
  useSummaryHistory,
} from "@/lib/hooks/use-summary"
import { useTranslateSummary } from "@/lib/hooks/use-generate"
import { useDefaultLanguage } from "@/lib/hooks/use-me"

const EXCLUDED_SLASH_TITLES = new Set(["Flashcards", "Quiz", "Audio", "AI block"])

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
})

// Preserve tiptap math nodes through the HTML -> markdown round-trip so
// LaTeX survives a save/reload. Without this turndown flattens the KaTeX
// render output to its inner text and the formula is lost.
turndown.addRule("inlineMath", {
  filter: (node) =>
    node.nodeName === "SPAN" &&
    (node as HTMLElement).getAttribute("data-type") === "inline-math",
  replacement: (_content, node) =>
    `$${(node as HTMLElement).getAttribute("data-latex") ?? ""}$`,
})
turndown.addRule("blockMath", {
  filter: (node) =>
    node.nodeName === "DIV" &&
    (node as HTMLElement).getAttribute("data-type") === "block-math",
  replacement: (_content, node) =>
    `\n\n$$${(node as HTMLElement).getAttribute("data-latex") ?? ""}$$\n\n`,
})

function markdownToHtml(md: string): string {
  if (!md) return ""
  return marked.parse(md, { async: false, gfm: true, breaks: false }) as string
}

function htmlToMarkdown(html: string): string {
  if (!html) return ""
  return turndown.turndown(html)
}

export default function NotebookSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const historyQuery = useSummaryHistory(id)
  const history = useMemo(() => historyQuery.data ?? [], [historyQuery.data])
  const isLoading = historyQuery.isPending
  const [genOpen, setGenOpen] = useState(false)
  const noSource = useHasNoSource(id)
  const userLanguage = useDefaultLanguage()
  const translate = useTranslateSummary(id)

  const availableLanguages = useMemo<LanguageCode[]>(() => {
    const seen = new Set<LanguageCode>()
    const out: LanguageCode[] = []
    for (const s of history) {
      const lc = normalizeLanguage(s.language)
      if (!seen.has(lc)) {
        seen.add(lc)
        out.push(lc)
      }
    }
    return out
  }, [history])

  const [language, setLanguage] = useState<LanguageCode | null>(null)
  useEffect(() => {
    if (language && availableLanguages.includes(language)) return
    setLanguage(pickInitialLanguage(availableLanguages, userLanguage))
  }, [availableLanguages, language, userLanguage])

  const selected = useMemo(() => {
    if (!language) return history[0] ?? null
    return history.find((s) => normalizeLanguage(s.language) === language) ?? null
  }, [history, language])

  async function handleTranslate(target: LanguageCode) {
    try {
      const row = await translate.mutateAsync({ targetLanguage: target })
      setLanguage(normalizeLanguage(row.language))
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to translate summary"
      toast.error(msg)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-8 pt-8 pb-16">
      {isLoading ? (
        <SummarySkeleton />
      ) : selected && language ? (
        <>
          <div className="mb-4 flex justify-end">
            <ArtifactLanguageSwitcher
              value={language}
              available={availableLanguages}
              onSelect={setLanguage}
              onTranslate={handleTranslate}
              pending={translate.isPending}
            />
          </div>
          <SummaryEditor
            key={selected.id}
            notebookId={id}
            summaryId={selected.id}
            initialMarkdown={selected.markdown}
          />
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <HugeiconsIcon
              icon={ParagraphBulletsPoint01Icon}
              strokeWidth={2}
              className="size-6"
            />
          </span>
          <p className="text-sm text-muted-foreground">
            No summary yet. Generate one with AI or write your own.
          </p>
          <NoSourceTooltip notebookId={id}>
            <Button
              type="button"
              size="sm"
              onClick={() => setGenOpen(true)}
              disabled={noSource}
            >
              <HugeiconsIcon
                icon={MagicWand01Icon}
                strokeWidth={2}
                className="size-4"
              />
              Summarize
            </Button>
          </NoSourceTooltip>
        </div>
      )}

      <GenerateSummaryDialog
        open={genOpen}
        onOpenChange={setGenOpen}
        notebookId={id}
      />
    </div>
  )
}

type SummaryEditorProps = {
  notebookId: string
  summaryId: string
  initialMarkdown: string
  className?: string
}

function SummaryEditor({
  notebookId,
  summaryId,
  initialMarkdown,
  className,
}: SummaryEditorProps) {
  const save = useDebouncedSaveSummary(notebookId)
  const lastSavedMarkdown = useRef(initialMarkdown)
  const mathEditorRef = useRef<Editor | null>(null)

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      CodeBlockExtension,
      createMathematicsExtension(() => mathEditorRef.current),
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === "heading" ? "Heading" : "Start writing…",
      }),
      CalloutExtension,
      SlashCommandExtension.configure({
        items: slashItems.filter((i) => !EXCLUDED_SLASH_TITLES.has(i.title)),
      }),
    ],
    [],
  )

  const editor = useEditor({
    extensions,
    content: markdownToHtml(initialMarkdown),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn("notebook-editor focus:outline-none", className),
      },
    },
    onCreate: ({ editor: ed }) => migrateMathStrings(ed),
    onUpdate: ({ editor: ed }) => {
      const md = htmlToMarkdown(ed.getHTML())
      if (md === lastSavedMarkdown.current) return
      lastSavedMarkdown.current = md
      save({ id: summaryId, markdown: md })
    },
  })

  useEffect(() => {
    mathEditorRef.current = editor
  }, [editor])

  return <EditorContent editor={editor} />
}

function SummarySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-1/2 rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-[94%] rounded-md" />
        <Skeleton className="h-4 w-[88%] rounded-md" />
      </div>
      <Skeleton className="h-6 w-1/3 rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-[90%] rounded-md" />
        <Skeleton className="h-4 w-[85%] rounded-md" />
        <Skeleton className="h-4 w-3/4 rounded-md" />
      </div>
    </div>
  )
}
