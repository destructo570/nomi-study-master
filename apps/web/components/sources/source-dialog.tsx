"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { FolderUploadIcon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { Textarea } from "@workspace/ui/components/textarea"

import {
  SUPPORTED_UPLOAD_EXTS,
  SUPPORTED_UPLOAD_MIMES,
  uploadKindForMime,
} from "@workspace/types"
import { fileByteLimit, formatBytes } from "@workspace/types/plan"
import { useMe } from "@/lib/hooks/use-me"

type TextSubmit = {
  type: "text"
  title: string
  content: string
}

type UrlSubmit = {
  type: "url"
  url: string
  title?: string
}

type FileSubmit = {
  type: "file"
  file: File
  title: string
}

export type SourceDialogSubmit = TextSubmit | UrlSubmit | FileSubmit

type SourceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: SourceDialogSubmit) => Promise<unknown> | unknown
}

type Tab = "text" | "link" | "file"

const ACCEPT_ATTR = [
  ...SUPPORTED_UPLOAD_EXTS.map((e) => `.${e}`),
  ...Object.values(SUPPORTED_UPLOAD_MIMES),
].join(",")

function mimeForFile(file: File): string {
  if (file.type) return file.type
  const ext = file.name.split(".").pop()?.toLowerCase()
  if (!ext) return ""
  return (SUPPORTED_UPLOAD_MIMES as Record<string, string>)[ext] ?? ""
}

function isLikelyUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  try {
    const u = new URL(trimmed)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

export function SourceDialog({ open, onOpenChange, onSubmit }: SourceDialogProps) {
  const [tab, setTab] = useState<Tab>("text")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [url, setUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const me = useMe()
  const plan = me.data?.plan ?? "free"

  const documentLimit = fileByteLimit(plan, "document")
  const mediaLimit = fileByteLimit(plan, "media")

  function reset() {
    setTitle("")
    setContent("")
    setUrl("")
    setFile(null)
    setTab("text")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleFilePicked(picked: File | null) {
    if (!picked) {
      setFile(null)
      return
    }
    const mime = mimeForFile(picked)
    const supported = Object.values(SUPPORTED_UPLOAD_MIMES).includes(mime)
    if (!supported) {
      toast.error(
        `Unsupported file type. Allowed: ${SUPPORTED_UPLOAD_EXTS.join(", ")}.`,
      )
      if (fileInputRef.current) fileInputRef.current.value = ""
      setFile(null)
      return
    }
    const kind = uploadKindForMime(mime) ?? undefined
    const sizeLimit = fileByteLimit(plan, kind)
    if (picked.size > sizeLimit) {
      toast.error(
        `File is too large (${formatBytes(picked.size)}). Limit is ${formatBytes(sizeLimit)} on the ${plan} plan.`,
      )
      if (fileInputRef.current) fileInputRef.current.value = ""
      setFile(null)
      return
    }
    setFile(picked)
    if (!title.trim()) {
      setTitle(picked.name.replace(/\.[^.]+$/, ""))
    }
  }

  const canSubmit = (() => {
    if (submitting) return false
    if (tab === "file") return !!file && !!title.trim()
    if (tab === "link") return isLikelyUrl(url)
    if (!title.trim()) return false
    return content.trim().length > 0
  })()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      if (tab === "file") {
        if (!file) return
        await onSubmit({ type: "file", file, title: title.trim() })
      } else if (tab === "link") {
        await onSubmit({
          type: "url",
          url: url.trim(),
          title: title.trim() || undefined,
        })
      } else {
        await onSubmit({ type: "text", title: title.trim(), content: content.trim() })
      }
      reset()
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) reset()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Add source</DialogTitle>
            <DialogDescription>
              Sources ground AI responses in your notebook.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="link">Link</TabsTrigger>
              <TabsTrigger value="file">File</TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-3 pt-3">
              <TitleField title={title} onChange={setTitle} />
              <div className="grid gap-2">
                <Label htmlFor="source-content">Content</Label>
                <Textarea
                  id="source-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste raw text…"
                  rows={8}
                />
              </div>
            </TabsContent>

            <TabsContent value="link" className="space-y-3 pt-3">
              <div className="grid gap-2">
                <Label htmlFor="source-url">URL</Label>
                <Input
                  id="source-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=…  or  https://example.com/article"
                />
                <p className="text-xs text-muted-foreground">
                  YouTube links are transcribed from captions; other links are
                  scraped as articles. Both run in the background.
                </p>
              </div>
              <TitleField title={title} onChange={setTitle} optional />
            </TabsContent>

            <TabsContent value="file" className="space-y-3 pt-3">
              <TitleField title={title} onChange={setTitle} />
              <div className="grid gap-2">
                <Label>File</Label>
                <label
                  htmlFor="source-file"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center transition hover:border-foreground/30 hover:bg-muted/50"
                >
                  <HugeiconsIcon
                    icon={FolderUploadIcon}
                    strokeWidth={2}
                    className="size-5 text-muted-foreground"
                  />
                  {file ? (
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Click to upload</p>
                      <p className="text-xs text-muted-foreground">
                        {SUPPORTED_UPLOAD_EXTS.join(", ")} - docs up to{" "}
                        {formatBytes(documentLimit)}, audio/video up to{" "}
                        {formatBytes(mediaLimit)}
                      </p>
                    </div>
                  )}
                </label>
                <input
                  ref={fileInputRef}
                  id="source-file"
                  type="file"
                  accept={ACCEPT_ATTR}
                  onChange={(e) => handleFilePicked(e.target.files?.[0] ?? null)}
                  className="sr-only"
                />
                <p className="text-xs text-muted-foreground">
                  Documents are parsed; audio and video are transcribed in the
                  background.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {tab === "file"
                ? "Upload"
                : tab === "link"
                  ? "Fetch & add"
                  : "Add source"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TitleField({
  title,
  onChange,
  optional = false,
}: {
  title: string
  onChange: (next: string) => void
  optional?: boolean
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="source-title">
        Title{optional && <span className="text-muted-foreground"> (optional)</span>}
      </Label>
      <Input
        id="source-title"
        value={title}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          optional ? "Auto-detected from the page if blank" : "e.g. RAG overview article"
        }
      />
    </div>
  )
}
