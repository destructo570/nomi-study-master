"use client"

import { useEffect, useMemo, useRef } from "react"
import Image from "@tiptap/extension-image"
import { migrateMathStrings } from "@tiptap/extension-mathematics"
import Placeholder from "@tiptap/extension-placeholder"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { marked } from "marked"
import TurndownService from "turndown"

import { cn } from "@workspace/ui/lib/utils"

import type { Source } from "@workspace/types"
import { SUPPORTED_UPLOAD_MIMES } from "@workspace/types"
import type { LanguageCode } from "@workspace/types/language"

import { AudioPlayer } from "@/components/sources/audio-player"
import { PdfViewer } from "@/components/sources/pdf-viewer"
import { VideoPlayer } from "@/components/sources/video-player"
import { YoutubeEmbed, videoIdFromUrl } from "@/components/sources/youtube-embed"
import { CalloutExtension } from "@/components/editor/extensions/callout"
import { CodeBlockExtension } from "@/components/editor/extensions/code-block"
import { createMathematicsExtension } from "@/components/editor/extensions/math"
import { SlashCommandExtension } from "@/components/editor/extensions/slash-command"
import { slashItems } from "@/components/editor/slash-items"
import {
  useDebouncedUpdateSource,
  useSourceFileUrl,
} from "@/lib/hooks/use-sources"

const AUDIO_MIMES = new Set<string>([
  SUPPORTED_UPLOAD_MIMES.mp3,
  SUPPORTED_UPLOAD_MIMES.m4a,
  SUPPORTED_UPLOAD_MIMES.aac,
])

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

type SourceEditorProps = {
  notebookId: string
  source: Source
  className?: string
  fillHeight?: boolean
  /** Which language version of the source body to render. When equal to
   *  the page's "original" language the editor is editable; otherwise we
   *  show the corresponding translation read-only. */
  viewLanguage?: LanguageCode
  /** The language that represents the editable canonical view. Anything
   *  else in `viewLanguage` is treated as a translation. */
  originalLanguage?: LanguageCode
}

export function SourceEditor({
  notebookId,
  source,
  className,
  fillHeight,
  viewLanguage,
  originalLanguage,
}: SourceEditorProps) {
  const save = useDebouncedUpdateSource(notebookId)
  const lastSavedMarkdown = useRef(source.content)
  const mathEditorRef = useRef<Editor | null>(null)

  const isOriginalView =
    !viewLanguage || !originalLanguage || viewLanguage === originalLanguage
  const translationBody = isOriginalView
    ? null
    : (source.translations?.[viewLanguage] ?? "")

  const extensions = useMemo(
    () => [
      // Disable StarterKit's plain codeBlock so CodeBlockLowlight (below) owns
      // the schema slot and tokenizes fenced code into highlight.js spans.
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      CodeBlockExtension,
      // Allow images so scraped articles render their figures inline.
      // `inline: false` keeps each image on its own block - matches how
      // Medium/Substack lay them out and keeps marked → tiptap stable.
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "rounded-lg border bg-muted",
          loading: "lazy",
          referrerpolicy: "no-referrer",
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === "heading" ? "Heading" : "Start writing…",
      }),
      createMathematicsExtension(() => mathEditorRef.current),
      CalloutExtension,
      SlashCommandExtension.configure({
        items: slashItems.filter((i) => !EXCLUDED_SLASH_TITLES.has(i.title)),
      }),
    ],
    [],
  )

  const editor = useEditor({
    extensions,
    content: markdownToHtml(source.content),
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
      save(source.id, { content: md })
    },
  })

  useEffect(() => {
    mathEditorRef.current = editor
  }, [editor])

  const isProcessing =
    source.status === "processing" || source.status === "pending_upload"
  const isFailed = source.status === "failed"
  const isAudio =
    source.type === "file" &&
    source.status === "ready" &&
    !!source.mimeType &&
    AUDIO_MIMES.has(source.mimeType)
  const isVideo =
    source.type === "file" &&
    source.status === "ready" &&
    source.mimeType === SUPPORTED_UPLOAD_MIMES.mp4
  const isPdf =
    source.type === "file" &&
    source.status === "ready" &&
    source.mimeType === SUPPORTED_UPLOAD_MIMES.pdf
  const youtubeVideoId =
    source.type === "youtube" ? videoIdFromUrl(source.sourceUrl) : null

  const fileUrlQuery = useSourceFileUrl(
    isAudio || isVideo || isPdf ? source.id : null,
  )

  if (isPdf) {
    return (
      <div className={cn(fillHeight ? "flex min-h-0 min-w-0 flex-1 flex-col" : "space-y-4")}>
        {fileUrlQuery.data?.url ? (
          <PdfViewer
            src={fileUrlQuery.data.url}
            sourceId={source.id}
            fileName={source.fileName}
            fillHeight={fillHeight}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
            Loading PDF…
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isProcessing && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
          {source.status === "pending_upload"
            ? "Uploading file…"
            : source.type === "youtube"
              ? "Fetching the YouTube transcript…"
              : source.type === "article"
                ? "Scraping the article…"
                : "Processing - extracting text or transcribing audio. This usually takes a few seconds."}
        </div>
      )}
      {isFailed && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Processing failed: {source.errorMessage ?? "unknown error"}
        </div>
      )}
      {youtubeVideoId && (
        <YoutubeEmbed videoId={youtubeVideoId} title={source.title} />
      )}
      {isAudio && fileUrlQuery.data?.url && (
        <AudioPlayer src={fileUrlQuery.data.url} />
      )}
      {isVideo && fileUrlQuery.data?.url && (
        <VideoPlayer src={fileUrlQuery.data.url} />
      )}
      {isOriginalView ? (
        <EditorContent editor={editor} />
      ) : (
        <TranslationView
          // Re-mount whenever the target language changes so the read-only
          // editor re-initialises with the new translation content.
          key={viewLanguage}
          markdown={translationBody ?? ""}
          className={className}
        />
      )}
    </div>
  )
}

function TranslationView({
  markdown,
  className,
}: {
  markdown: string
  className?: string
}) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      CodeBlockExtension,
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "rounded-lg border bg-muted",
          loading: "lazy",
          referrerpolicy: "no-referrer",
        },
      }),
      CalloutExtension,
      createMathematicsExtension(() => null),
    ],
    [],
  )
  const editor = useEditor({
    extensions,
    content: markdownToHtml(markdown),
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn("notebook-editor focus:outline-none", className),
      },
    },
    onCreate: ({ editor: ed }) => migrateMathStrings(ed),
  })
  return <EditorContent editor={editor} />
}
