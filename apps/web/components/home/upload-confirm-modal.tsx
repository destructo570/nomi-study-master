"use client"

import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  FileEditIcon,
  HeadphonesIcon,
  PlayIcon,
  Upload01Icon,
} from "@hugeicons/core-free-icons"

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
  SUPPORTED_UPLOAD_EXTS,
  SUPPORTED_UPLOAD_MIMES,
  uploadKindForMime,
  type UploadFileExt,
} from "@workspace/types"
import { fileByteLimit, formatBytes, type Plan } from "@workspace/types/plan"

import { useDefaultLanguage } from "@/lib/hooks/use-me"
import { LanguageCombobox } from "@/components/language-combobox"
import type { LanguageCode } from "@workspace/types/language"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: File | null
  plan: Plan
  submitting?: boolean
  onConfirm: (input: {
    file: File
    mime: string
    title: string
    language: LanguageCode
  }) => void | Promise<void>
  onPickAgain: () => void
}

type Validation =
  | { ok: true; mime: string; kind: "document" | "media"; sizeLimit: number }
  | { ok: false; reason: string }

function guessMimeFromName(name: string): string | null {
  const ext = name.split(".").pop()?.toLowerCase()
  if (!ext) return null
  return (SUPPORTED_UPLOAD_MIMES as Record<string, string>)[ext] ?? null
}

function validate(file: File, plan: Plan): Validation {
  const mime = file.type || guessMimeFromName(file.name) || ""
  if (!mime || !Object.values(SUPPORTED_UPLOAD_MIMES).includes(mime)) {
    return {
      ok: false,
      reason: `Unsupported file type. Allowed: ${SUPPORTED_UPLOAD_EXTS.join(", ")}.`,
    }
  }
  const kind = uploadKindForMime(mime)
  if (!kind) {
    return { ok: false, reason: "Unsupported file type." }
  }
  const sizeLimit = fileByteLimit(plan, kind)
  if (file.size > sizeLimit) {
    return {
      ok: false,
      reason: `File is ${formatBytes(file.size)} - over the ${formatBytes(sizeLimit)} limit on the ${plan} plan.`,
    }
  }
  return { ok: true, mime, kind, sizeLimit }
}

function iconForExt(ext: string): typeof FileEditIcon {
  if (ext === "mp3" || ext === "m4a" || ext === "aac") return HeadphonesIcon
  if (ext === "mp4" || ext === "webm") return PlayIcon
  return FileEditIcon
}

function readableType(mime: string, ext: string): string {
  const k = uploadKindForMime(mime)
  if (k === "media") {
    if (ext === "mp4" || ext === "webm") return "Video"
    return "Audio"
  }
  if (ext === "pdf") return "PDF"
  if (ext === "docx") return "Word document"
  if (ext === "txt") return "Text file"
  return ext.toUpperCase()
}

export function UploadConfirmModal({
  open,
  onOpenChange,
  file,
  plan,
  submitting,
  onConfirm,
  onPickAgain,
}: Props) {
  const defaultLanguage = useDefaultLanguage()
  const [title, setTitle] = useState("")
  const [language, setLanguage] = useState<LanguageCode>(defaultLanguage)

  // Seed inputs when a new file is presented to the modal.
  useEffect(() => {
    if (open && file) {
      setTitle(file.name.replace(/\.[^.]+$/, "") || "Untitled")
      setLanguage(defaultLanguage)
    }
  }, [open, file, defaultLanguage])

  if (!file) return null

  const ext = (file.name.split(".").pop() ?? "").toLowerCase() as UploadFileExt
  const result = validate(file, plan)
  const sizeStr = formatBytes(file.size)
  const Icon = iconForExt(ext)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!result.ok || !file || submitting) return
    await onConfirm({
      file,
      mime: result.mime,
      title: title.trim() || file.name.replace(/\.[^.]+$/, "") || "Untitled",
      language,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-1rem)] sm:max-w-xl">
        <form onSubmit={handleSubmit} className="grid min-w-0 gap-4">
          <DialogHeader>
            <DialogTitle>Upload file</DialogTitle>
            <DialogDescription className="break-words">
              Confirm the details below. We&apos;ll create a notebook and start
              processing the file in the background.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background text-foreground ring-1 ring-border">
              <HugeiconsIcon icon={Icon} strokeWidth={2} className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {result.ok ? readableType(result.mime, ext) : ext.toUpperCase()} · {sizeStr}
              </p>
              {result.ok ? (
                <p className="mt-1 text-[11px] text-muted-foreground break-words">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    strokeWidth={2}
                    className="inline size-3 text-foreground align-[-1px]"
                  />
                  {" "}Within {formatBytes(result.sizeLimit)} {plan} plan limit
                </p>
              ) : (
                <p className="mt-1 text-[12px] text-destructive break-words">
                  <HugeiconsIcon
                    icon={AlertCircleIcon}
                    strokeWidth={2}
                    className="inline size-3.5 align-[-1px]"
                  />
                  {" "}{result.reason}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="upload-title">Title</Label>
            <Input
              id="upload-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notebook title"
              disabled={submitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="upload-language">Language</Label>
            <LanguageCombobox
              value={language}
              onChange={setLanguage}
              disabled={submitting}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              AI generations from this file - summary, flashcards, quizzes - will be in this language.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 max-sm:[&>button]:w-full">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onPickAgain}
              disabled={submitting}
            >
              Choose different file
            </Button>
            <Button type="submit" disabled={!result.ok || submitting}>
              <HugeiconsIcon
                icon={Upload01Icon}
                strokeWidth={2}
                className="size-4"
              />
              {submitting ? "Uploading…" : "Upload & create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
