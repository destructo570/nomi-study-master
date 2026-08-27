"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import posthog from "posthog-js"
import { useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ClipboardPasteIcon,
  Link01Icon,
  Mic01Icon,
  SentIcon,
  Upload01Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"

import { api, PlanLimitError, QuotaExceededError } from "@/lib/api"
import { qk } from "@/lib/query-keys"
import { uploadFileToNotebookSource } from "@/lib/hooks/use-sources"
import { useEnsureDefaultShelf } from "@/lib/hooks/use-default-shelf"
import { useDefaultLanguage, useMe } from "@/lib/hooks/use-me"
import {
  randomNotebookCover,
  SUPPORTED_UPLOAD_EXTS,
  SUPPORTED_UPLOAD_MIMES,
} from "@workspace/types"
import type { LanguageCode } from "@workspace/types/language"

import { QuickActionCard } from "./quick-action-card"
import { LinkModal, TextModal } from "./quick-action-modals"
import { UploadConfirmModal } from "./upload-confirm-modal"

const FILE_ACCEPT = [
  ...SUPPORTED_UPLOAD_EXTS.map((e) => `.${e}`),
  ...Object.values(SUPPORTED_UPLOAD_MIMES),
].join(",")

function recordingTitle(): string {
  return `Recording - ${new Date().toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`
}

function isHttpUrl(url: string): boolean {
  try {
    const u = new URL(url.trim())
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

export function HomeHero() {
  const router = useRouter()
  const qc = useQueryClient()
  const me = useMe()
  const defaultLanguage = useDefaultLanguage()
  const ensureDefaultShelf = useEnsureDefaultShelf()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [chatInput, setChatInput] = useState("")
  const [linkOpen, setLinkOpen] = useState(false)
  const [textOpen, setTextOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [busy, setBusy] = useState<null | "upload" | "link" | "text" | "record">(
    null,
  )

  const firstName =
    (me.data?.name?.trim().split(/\s+/)[0] ??
      me.data?.email?.split("@")[0] ??
      "") || null

  function handleQuickActionError(err: unknown) {
    if (err instanceof PlanLimitError || err instanceof QuotaExceededError) {
      // Upgrade modal already triggered upstream.
      return
    }
    const msg = err instanceof Error ? err.message : "Something went wrong"
    toast.error(msg)
  }

  async function handleUploadClick() {
    posthog.capture("quick_action_used", { kind: "upload" })
    fileInputRef.current?.click()
  }

  // First step: file is picked from the native dialog. We don't validate or
  // upload here - that all happens inside the confirmation modal, which shows
  // the file, validates size/type inline, and lets the user pick a language.
  function handleFilePicked(file: File | null) {
    if (!file) return
    if (busy) return
    setPendingFile(file)
    setUploadOpen(true)
  }

  function closeUploadModal(open: boolean) {
    if (open) {
      setUploadOpen(true)
      return
    }
    if (busy === "upload") return
    setUploadOpen(false)
    setPendingFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function pickAgain() {
    if (busy === "upload") return
    if (fileInputRef.current) fileInputRef.current.value = ""
    fileInputRef.current?.click()
  }

  async function handleUploadConfirm({
    file,
    mime,
    title,
    language,
  }: {
    file: File
    mime: string
    title: string
    language: LanguageCode
  }) {
    if (busy) return
    setBusy("upload")
    try {
      const shelf = await ensureDefaultShelf()
      const nb = await api.createNotebook(
        shelf.id,
        title,
        randomNotebookCover(),
        language,
      )
      await uploadFileToNotebookSource({
        notebookId: nb.id,
        file,
        title,
      })
      qc.invalidateQueries({ queryKey: qk.recents() })
      qc.invalidateQueries({ queryKey: qk.notebooksByShelf(shelf.id) })
      qc.invalidateQueries({ queryKey: qk.shelves() })
      posthog.capture("notebook_created", {
        source_type: "file",
        from: "home_quick_action",
        notebook_id: nb.id,
        file_size_bytes: file.size,
        mime,
      })
      toast.success("Upload started - opening your notebook.")
      setUploadOpen(false)
      setPendingFile(null)
      router.push(`/notebook/${nb.id}`)
    } catch (err) {
      handleQuickActionError(err)
      posthog.captureException(err)
    } finally {
      setBusy(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleLinkSubmit({
    url,
    language,
  }: {
    url: string
    language: LanguageCode
  }) {
    if (busy) return
    posthog.capture("quick_action_used", { kind: "link" })
    setBusy("link")
    try {
      if (!isHttpUrl(url)) {
        toast.error("That doesn't look like a valid URL.")
        setBusy(null)
        return
      }
      const shelf = await ensureDefaultShelf()
      const nb = await api.createNotebook(
        shelf.id,
        url,
        randomNotebookCover(),
        language,
      )
      await api.addSource({
        notebookId: nb.id,
        type: "url",
        url,
      })
      qc.invalidateQueries({ queryKey: qk.recents() })
      qc.invalidateQueries({ queryKey: qk.notebooksByShelf(shelf.id) })
      qc.invalidateQueries({ queryKey: qk.shelves() })
      posthog.capture("notebook_created", {
        source_type: "url",
        from: "home_quick_action",
        notebook_id: nb.id,
        url_host: safeHost(url),
      })
      setLinkOpen(false)
      router.push(`/notebook/${nb.id}`)
    } catch (err) {
      handleQuickActionError(err)
      posthog.captureException(err)
    } finally {
      setBusy(null)
    }
  }

  async function handleTextSubmit({
    title,
    content,
    language,
  }: {
    title: string
    content: string
    language: LanguageCode
  }) {
    if (busy) return
    posthog.capture("quick_action_used", { kind: "text" })
    setBusy("text")
    try {
      const shelf = await ensureDefaultShelf()
      const nb = await api.createNotebook(
        shelf.id,
        title,
        randomNotebookCover(),
        language,
      )
      await api.addSource({
        notebookId: nb.id,
        type: "text",
        title,
        content,
      })
      qc.invalidateQueries({ queryKey: qk.recents() })
      qc.invalidateQueries({ queryKey: qk.notebooksByShelf(shelf.id) })
      qc.invalidateQueries({ queryKey: qk.shelves() })
      posthog.capture("notebook_created", {
        source_type: "text",
        from: "home_quick_action",
        notebook_id: nb.id,
        content_length: content.length,
      })
      setTextOpen(false)
      router.push(`/notebook/${nb.id}`)
    } catch (err) {
      handleQuickActionError(err)
      posthog.captureException(err)
    } finally {
      setBusy(null)
    }
  }

  async function handleRecordClick() {
    if (busy) return
    posthog.capture("quick_action_used", { kind: "record" })
    setBusy("record")
    try {
      const shelf = await ensureDefaultShelf()
      const nb = await api.createNotebook(
        shelf.id,
        recordingTitle(),
        randomNotebookCover(),
        defaultLanguage,
      )
      qc.invalidateQueries({ queryKey: qk.recents() })
      qc.invalidateQueries({ queryKey: qk.notebooksByShelf(shelf.id) })
      qc.invalidateQueries({ queryKey: qk.shelves() })
      posthog.capture("notebook_created", {
        source_type: "recording",
        from: "home_quick_action",
        notebook_id: nb.id,
      })
      router.push(`/notebook/${nb.id}/source?record=1`)
    } catch (err) {
      handleQuickActionError(err)
      posthog.captureException(err)
    } finally {
      setBusy(null)
    }
  }

  function handleAsk(e?: React.FormEvent) {
    e?.preventDefault()
    const q = chatInput.trim()
    if (!q) return
    posthog.capture("quick_action_used", {
      kind: "ask",
      question_length: q.length,
    })
    router.push(`/chat?q=${encodeURIComponent(q)}`)
  }

  return (
    <section className="space-y-6">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-light tracking-tight sm:text-5xl">
          What do you want to learn today{firstName ? `, ${firstName}` : ""}?
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickActionCard
          icon={Upload01Icon}
          title="Upload any file"
          subtitle="Pdf, Video, Audio"
          badge="Popular"
          onClick={handleUploadClick}
          disabled={busy !== null}
          tint="bg-ember/7 border-ember/30 dark:bg-card dark:border-border"
        />
        <QuickActionCard
          icon={Link01Icon}
          title="Paste any link"
          subtitle="Youtube, website, articles"
          onClick={() => setLinkOpen(true)}
          disabled={busy !== null}
          tint="bg-signal-blue/7 border-signal-blue/30 dark:bg-card dark:border-border"
        />
        <QuickActionCard
          icon={ClipboardPasteIcon}
          title="Paste raw text"
          subtitle="Paste any raw source text"
          onClick={() => setTextOpen(true)}
          disabled={busy !== null}
          tint="bg-violet-500/7 border-violet-500/30 dark:bg-card dark:border-border"
        />
        <QuickActionCard
          icon={Mic01Icon}
          title="Record Audio"
          subtitle="Record lecture and meetings."
          onClick={handleRecordClick}
          disabled={busy !== null}
          tint="bg-emerald-500/7 border-emerald-500/30 dark:bg-card dark:border-border"
        />
      </div>

      <form
        onSubmit={handleAsk}
        className="mx-auto flex max-w-2xl items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-hairline transition focus-within:border-foreground/25"
      >
        <Textarea
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              handleAsk()
            }
          }}
          rows={1}
          placeholder="Ask anything"
          className="max-h-32 min-h-8 flex-1 resize-none rounded-none border-0 bg-transparent px-1 py-1 text-sm shadow-none placeholder:text-muted-foreground focus-visible:border-0 focus-visible:ring-0"
        />
        <Button
          type="submit"
          size="icon-sm"
          disabled={!chatInput.trim()}
          aria-label="Ask"
          className="shrink-0 rounded-full"
        >
          <HugeiconsIcon icon={SentIcon} strokeWidth={2} className="size-4" />
        </Button>
      </form>

      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_ACCEPT}
        className="sr-only"
        onChange={(e) => handleFilePicked(e.target.files?.[0] ?? null)}
      />

      <LinkModal
        open={linkOpen}
        onOpenChange={(open) => !busy && setLinkOpen(open)}
        submitting={busy === "link"}
        onSubmit={handleLinkSubmit}
      />
      <TextModal
        open={textOpen}
        onOpenChange={(open) => !busy && setTextOpen(open)}
        submitting={busy === "text"}
        onSubmit={handleTextSubmit}
      />
      <UploadConfirmModal
        open={uploadOpen}
        onOpenChange={closeUploadModal}
        file={pendingFile}
        plan={me.data?.plan ?? "free"}
        submitting={busy === "upload"}
        onConfirm={handleUploadConfirm}
        onPickAgain={pickAgain}
      />
    </section>
  )
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).host
  } catch {
    return null
  }
}
