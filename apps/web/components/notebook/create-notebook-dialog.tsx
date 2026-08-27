"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import posthog from "posthog-js"
import { useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  CheckmarkCircle02Icon,
  DocumentCodeIcon,
  FolderUploadIcon,
  SparklesIcon,
  TextIcon,
  YoutubeIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"

import { api, PlanLimitError, QuotaExceededError } from "@/lib/api"
import { qk } from "@/lib/query-keys"
import { useCreateNotebookFromCourse } from "@/lib/hooks/use-chapters"
import { uploadFileToNotebookSource } from "@/lib/hooks/use-sources"
import { fileByteLimit, formatBytes } from "@workspace/types/plan"
import { useDefaultLanguage, useMe } from "@/lib/hooks/use-me"
import {
  randomNotebookCover,
  SUPPORTED_UPLOAD_EXTS,
  SUPPORTED_UPLOAD_MIMES,
  uploadKindForMime,
} from "@workspace/types"
import type { LanguageCode } from "@workspace/types/language"
import { CoverPicker } from "@/components/notebook/cover-picker"
import { LanguageCombobox } from "@/components/language-combobox"

type Step = "source" | "generating"
type GeneratingPhase = "loading" | "done"

const MIN_LOADER_MS = 1000

type DialogSourceType = "text" | "youtube" | "file"

type SourceTypeMeta = {
  id: DialogSourceType
  label: string
  icon: typeof YoutubeIcon
  kind: "text" | "file"
  placeholder?: string
  rows?: number
  helper: string
}

const SOURCE_TYPES: SourceTypeMeta[] = [
  {
    id: "youtube",
    label: "YouTube",
    icon: YoutubeIcon,
    kind: "text",
    placeholder: "https://youtube.com/watch?v=…",
    rows: 2,
    helper: "Paste a YouTube URL. We'll build the notebook from the video.",
  },
  {
    id: "text",
    label: "Raw text",
    icon: TextIcon,
    kind: "text",
    placeholder: "Paste the raw text you want to learn from…",
    rows: 8,
    helper: "Paste any text - notes, transcripts, essays, anything.",
  },
  {
    id: "file",
    label: "File",
    icon: FolderUploadIcon,
    kind: "file",
    helper: `Upload a ${SUPPORTED_UPLOAD_EXTS.join(", ")}. Documents are parsed; audio and video are transcribed in the background.`,
  },
]

const FILE_ACCEPT = [
  ...SUPPORTED_UPLOAD_EXTS.map((e) => `.${e}`),
  ...Object.values(SUPPORTED_UPLOAD_MIMES),
].join(",")

function mimeForFile(file: File): string {
  if (file.type) return file.type
  const ext = file.name.split(".").pop()?.toLowerCase()
  if (!ext) return ""
  return (SUPPORTED_UPLOAD_MIMES as Record<string, string>)[ext] ?? ""
}

type CreateNotebookDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  shelfId: string
}

export function CreateNotebookDialog({
  open,
  onOpenChange,
  shelfId,
}: CreateNotebookDialogProps) {
  const router = useRouter()
  const qc = useQueryClient()
  const createFromCourse = useCreateNotebookFromCourse()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const defaultLanguage = useDefaultLanguage()
  const [step, setStep] = useState<Step>("source")
  const [generatingPhase, setGeneratingPhase] = useState<GeneratingPhase>("loading")
  const [createdNotebookId, setCreatedNotebookId] = useState<string | null>(null)
  const [sourceType, setSourceType] = useState<DialogSourceType>("youtube")
  const [title, setTitle] = useState("")
  const [textContent, setTextContent] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [cover, setCover] = useState<string>(() => randomNotebookCover())
  const [coverPickerOpen, setCoverPickerOpen] = useState(false)
  const [language, setLanguage] = useState<LanguageCode>(defaultLanguage)

  // Re-sync when the user's default changes (e.g. after Settings update) and
  // also reset on each open via the reset() flow.
  useEffect(() => {
    setLanguage(defaultLanguage)
  }, [defaultLanguage])

  const active = SOURCE_TYPES.find((s) => s.id === sourceType)!
  const me = useMe()
  const plan = me.data?.plan ?? "free"

  const isFileSource = sourceType === "file"
  const documentLimit = fileByteLimit(plan, "document")
  const mediaLimit = fileByteLimit(plan, "media")

  const sourceReady = (() => {
    if (!title.trim()) return false
    if (isFileSource) return !!file
    return textContent.trim().length > 0
  })()

  function resetFileInput() {
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function reset() {
    setStep("source")
    setGeneratingPhase("loading")
    setCreatedNotebookId(null)
    setSourceType("youtube")
    setTitle("")
    setTextContent("")
    setFile(null)
    setCover(randomNotebookCover())
    setCoverPickerOpen(false)
    setLanguage(defaultLanguage)
    resetFileInput()
  }

  function close(next: boolean) {
    onOpenChange(next)
    if (!next) setTimeout(reset, 200)
  }

  function selectSourceType(next: DialogSourceType) {
    setSourceType(next)
    setTextContent("")
    setFile(null)
    resetFileInput()
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
      resetFileInput()
      setFile(null)
      return
    }
    const kind = uploadKindForMime(mime) ?? undefined
    const sizeLimit = fileByteLimit(plan, kind)
    if (picked.size > sizeLimit) {
      toast.error(
        `File is too large (${formatBytes(picked.size)}). Limit is ${formatBytes(sizeLimit)} on the ${plan} plan.`,
      )
      resetFileInput()
      setFile(null)
      return
    }
    setFile(picked)
    if (!title.trim()) {
      setTitle(picked.name.replace(/\.[^.]+$/, ""))
    }
  }

  async function generate() {
    setStep("generating")
    setGeneratingPhase("loading")
    setCreatedNotebookId(null)
    const startedAt = Date.now()
    try {
      let nbId: string
      if (isFileSource) {
        if (!file) throw new Error("Pick a file first")
        const nb = await api.createNotebook(shelfId, title.trim(), cover, language)
        await uploadFileToNotebookSource({
          notebookId: nb.id,
          file,
          title: title.trim(),
        })
        nbId = nb.id
        qc.invalidateQueries({ queryKey: qk.notebooksByShelf(nb.shelfId) })
        qc.invalidateQueries({ queryKey: qk.shelves() })
        qc.invalidateQueries({ queryKey: qk.recents() })
        posthog.capture("notebook_created", {
          source_type: "file",
          from: "create_dialog",
          notebook_id: nb.id,
          file_size_bytes: file.size,
          mime: file.type || null,
        })
      } else if (sourceType === "youtube") {
        // Use the same async transcription pipeline as the home LinkModal -
        // create the notebook, then enqueue the URL source so the worker
        // fetches the YouTube transcript via transcriptapi.com. Pre-dialog
        // behaviour stored the URL as raw text content and never ran the
        // worker, so transcripts never landed.
        const nb = await api.createNotebook(
          shelfId,
          title.trim(),
          cover,
          language,
        )
        await api.addSource({
          notebookId: nb.id,
          type: "url",
          url: textContent.trim(),
          title: title.trim(),
        })
        nbId = nb.id
        qc.invalidateQueries({ queryKey: qk.notebooksByShelf(nb.shelfId) })
        qc.invalidateQueries({ queryKey: qk.shelves() })
        qc.invalidateQueries({ queryKey: qk.recents() })
        posthog.capture("notebook_created", {
          source_type: "youtube",
          from: "create_dialog",
          notebook_id: nb.id,
          plan,
        })
      } else {
        const sourcePayload = {
          type: sourceType as Exclude<DialogSourceType, "file" | "youtube">,
          title: title.trim(),
          content: textContent.trim(),
        }

        const nb = await createFromCourse.mutateAsync({
          shelfId,
          title: title.trim(),
          cover,
          language,
          source: sourcePayload,
        })
        nbId = nb.id
        posthog.capture("notebook_created", {
          source_type: sourceType,
          from: "create_dialog",
          notebook_id: nb.id,
          content_length: textContent.length,
          plan,
        })
      }

      const remaining = MIN_LOADER_MS - (Date.now() - startedAt)
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining))
      }

      setCreatedNotebookId(nbId)
      setGeneratingPhase("done")
    } catch (e) {
      const isPlanError =
        e instanceof PlanLimitError || e instanceof QuotaExceededError
      const msg = e instanceof Error ? e.message : "Something went wrong"
      if (!isPlanError) {
        toast.error(msg)
        posthog.captureException(e)
      }
      posthog.capture("notebook_create_failed", {
        source_type: sourceType,
        reason: isPlanError ? "plan_or_quota" : "error",
        message: msg,
      })
      if (isPlanError) close(false)
      else setStep("source")
    }
  }

  function openNotebook() {
    if (!createdNotebookId) return
    const id = createdNotebookId
    close(false)
    router.push(`/notebook/${id}`)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create a notebook</DialogTitle>
          <DialogDescription>
            Pick a source to build the notebook from.
          </DialogDescription>
        </DialogHeader>

        {step === "source" && (
          <div className="mt-2 grid gap-4">
            <div className="grid grid-cols-3 gap-2">
              {SOURCE_TYPES.map((s) => {
                const isActive = s.id === sourceType
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectSourceType(s.id)}
                    className={
                      isActive
                        ? "flex flex-col items-center gap-1.5 rounded-xl border-2 border-primary bg-primary/5 p-3 text-sm transition"
                        : "flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background p-3 text-sm text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
                    }
                  >
                    <HugeiconsIcon icon={s.icon} strokeWidth={2} className="size-5" />
                    <span className="font-medium">{s.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nb-title">Title</Label>
              <Input
                id="nb-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`e.g. ${active.label} deep-dive`}
              />
            </div>

            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => setCoverPickerOpen((v) => !v)}
                className="flex items-center gap-3 rounded-xl border border-border bg-background p-2 text-left transition hover:border-foreground/20"
              >
                <span className="relative h-10 w-16 shrink-0 overflow-hidden rounded-md ring-1 ring-border">
                  <img
                    src={`/icons/notebook_bgs/${cover}.webp`}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                  />
                </span>
                <span className="flex flex-1 flex-col text-xs">
                  <span className="font-medium text-foreground">Cover</span>
                  <span className="text-muted-foreground">
                    {coverPickerOpen ? "Tap a cover to choose" : "Random cover assigned - tap to change"}
                  </span>
                </span>
              </button>
              {coverPickerOpen && (
                <CoverPicker value={cover} onChange={setCover} />
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nb-language">Language</Label>
              <LanguageCombobox
                value={language}
                onChange={setLanguage}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                AI-generated summary, flashcards, and quizzes will be in this language.
              </p>
            </div>

            {active.kind === "file" ? (
              <div className="grid gap-2">
                <Label>File</Label>
                <label
                  htmlFor="nb-file"
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
                  id="nb-file"
                  type="file"
                  accept={FILE_ACCEPT}
                  onChange={(e) =>
                    handleFilePicked(e.target.files?.[0] ?? null)
                  }
                  className="sr-only"
                />
                <p className="text-xs text-muted-foreground">{active.helper}</p>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="nb-content">Source</Label>
                <Textarea
                  id="nb-content"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder={active.placeholder}
                  rows={active.rows}
                />
                <p className="text-xs text-muted-foreground">{active.helper}</p>
              </div>
            )}
          </div>
        )}

        {step === "generating" && generatingPhase === "loading" && (
          <div className="mt-4 flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HugeiconsIcon
                icon={SparklesIcon}
                strokeWidth={2}
                className="size-6 animate-pulse"
              />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium">Creating your notebook…</p>
              <p className="text-xs text-muted-foreground">{title || "Untitled"}</p>
            </div>
            <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/3 animate-[shimmer_1.6s_infinite] bg-primary/60" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <HugeiconsIcon icon={DocumentCodeIcon} strokeWidth={2} className="size-3.5" />
              Setting things up
            </div>
          </div>
        )}

        {step === "generating" && generatingPhase === "done" && (
          <div className="mt-4 flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-foreground/10 text-foreground">
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                strokeWidth={2}
                className="size-6"
              />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium">Your notebook is ready</p>
              <p className="text-xs text-muted-foreground">{title || "Untitled"}</p>
            </div>
          </div>
        )}

        <div className="mt-2 flex justify-between gap-2">
          {step !== "generating" ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (step === "source") close(false)
                else setStep("source")
              }}
            >
              {step === "source" ? (
                "Cancel"
              ) : (
                <>
                  <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className="size-4" />
                  Back
                </>
              )}
            </Button>
          ) : (
            <span />
          )}

          {step === "source" && (
            <Button
              type="button"
              onClick={generate}
              disabled={!sourceReady}
            >
              <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-4" />
              Create notebook
            </Button>
          )}
          {step === "generating" && generatingPhase === "done" && (
            <Button type="button" onClick={openNotebook}>
              Open notebook
              <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2} className="size-4" />
            </Button>
          )}
          {step === "generating" && generatingPhase === "loading" && <span />}
        </div>
      </DialogContent>
    </Dialog>
  )
}
