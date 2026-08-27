"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Mic01Icon, StopCircleIcon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Label } from "@workspace/ui/components/label"

import { uploadFileToNotebookSource } from "@/lib/hooks/use-sources"
import { useQueryClient } from "@tanstack/react-query"
import { qk } from "@/lib/query-keys"
import { useDefaultLanguage } from "@/lib/hooks/use-me"
import {
  useNotebook,
  useUpdateNotebookLanguage,
} from "@/lib/hooks/use-workspace"
import { LanguageCombobox } from "@/components/language-combobox"
import { normalizeLanguage, type LanguageCode } from "@workspace/types/language"

type RecordAudioDialogProps = {
  notebookId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When true, recording starts as soon as the dialog opens. */
  autoStart?: boolean
}

type Phase = "idle" | "requesting" | "recording" | "uploading" | "error"

function pickMimeType(): string {
  // Chrome/Firefox/Edge support webm/opus. Safari supports mp4. Fall back to
  // empty so the platform picks the default.
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mpeg",
  ]
  if (typeof MediaRecorder === "undefined") return ""
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c
  }
  return ""
}

function extensionForMime(mime: string): string {
  if (mime.startsWith("audio/webm")) return "webm"
  if (mime.startsWith("audio/mp4")) return "m4a"
  if (mime.startsWith("audio/mpeg")) return "mp3"
  if (mime.startsWith("audio/ogg")) return "ogg"
  return "webm"
}

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function RecordAudioDialog({
  notebookId,
  open,
  onOpenChange,
  autoStart,
}: RecordAudioDialogProps) {
  const qc = useQueryClient()
  const userLanguage = useDefaultLanguage()
  const notebook = useNotebook(notebookId)
  const notebookLanguage = notebook.data?.language
    ? normalizeLanguage(notebook.data.language)
    : null
  const currentLanguage: LanguageCode = notebookLanguage ?? userLanguage
  const updateLanguage = useUpdateNotebookLanguage(notebookId)
  const [phase, setPhase] = useState<Phase>("idle")
  const [error, setError] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)

  function changeLanguage(next: LanguageCode) {
    if (next === currentLanguage) return
    updateLanguage.mutate(next, {
      onError: (err) => {
        const msg = err instanceof Error ? err.message : "Failed to save language"
        toast.error(msg)
      },
    })
  }

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const mimeRef = useRef<string>("")
  const startedAtRef = useRef<number>(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoStartHandledRef = useRef(false)

  function cleanupStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  function clearTick() {
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      clearTick()
      cleanupStream()
    }
  }, [])

  useEffect(() => {
    if (!open) {
      // Reset on close.
      setPhase("idle")
      setError(null)
      setElapsedMs(0)
      chunksRef.current = []
      autoStartHandledRef.current = false
      clearTick()
      cleanupStream()
      recorderRef.current = null
    }
  }, [open])

  async function startRecording() {
    if (phase === "recording" || phase === "requesting") return
    setError(null)
    setPhase("requesting")
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices) {
        throw new Error("Microphone access is not available in this browser.")
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = pickMimeType()
      mimeRef.current = mimeType
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      recorderRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onerror = (e) => {
        console.error("[record] recorder error", e)
      }
      recorder.start(1000)

      startedAtRef.current = Date.now()
      setElapsedMs(0)
      tickRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startedAtRef.current)
      }, 250)
      setPhase("recording")
    } catch (err) {
      cleanupStream()
      const msg =
        err instanceof Error
          ? err.message
          : "Could not access microphone. Check browser permissions."
      setError(msg)
      setPhase("error")
    }
  }

  async function stopAndUpload() {
    const recorder = recorderRef.current
    if (!recorder) return
    if (phase !== "recording") return

    setPhase("uploading")
    clearTick()

    const stopped = new Promise<void>((resolve) => {
      const handler = () => {
        recorder.removeEventListener("stop", handler)
        resolve()
      }
      recorder.addEventListener("stop", handler)
    })
    recorder.stop()
    await stopped
    cleanupStream()

    const mime = mimeRef.current || recorder.mimeType || "audio/webm"
    const blob = new Blob(chunksRef.current, { type: mime })
    if (blob.size === 0) {
      setError("Recording was empty. Try again.")
      setPhase("error")
      return
    }
    const ext = extensionForMime(mime)
    const fileName = `recording-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.${ext}`
    const file = new File([blob], fileName, { type: mime })

    try {
      await uploadFileToNotebookSource({
        notebookId,
        file,
        title: fileName.replace(/\.[^.]+$/, ""),
      })
      qc.invalidateQueries({ queryKey: qk.sources(notebookId) })
      toast.success("Recording uploaded - transcribing in the background.")
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed"
      setError(msg)
      setPhase("error")
    }
  }

  async function cancel() {
    const recorder = recorderRef.current
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop()
      } catch {
        // ignore
      }
    }
    clearTick()
    cleanupStream()
    chunksRef.current = []
    onOpenChange(false)
  }

  // Auto-start support: kick recording the first time the dialog opens.
  useEffect(() => {
    if (!open) return
    if (!autoStart) return
    if (autoStartHandledRef.current) return
    autoStartHandledRef.current = true
    void startRecording()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoStart])

  return (
    <Dialog open={open} onOpenChange={(next) => !next && cancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record audio</DialogTitle>
          <DialogDescription>
            We&apos;ll add this recording as a source and transcribe it in the
            background.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <span
            className={
              phase === "recording"
                ? "flex size-20 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-4 ring-destructive/20"
                : "flex size-20 items-center justify-center rounded-full bg-muted text-foreground"
            }
            aria-hidden
          >
            <HugeiconsIcon
              icon={Mic01Icon}
              strokeWidth={2}
              className={
                phase === "recording" ? "size-9 animate-pulse" : "size-9"
              }
            />
          </span>
          <div className="font-mono text-2xl tabular-nums">
            {formatElapsed(elapsedMs)}
          </div>
          <div className="text-xs text-muted-foreground">
            {phase === "idle" && "Ready when you are."}
            {phase === "requesting" && "Asking for microphone access…"}
            {phase === "recording" && "Recording - speak now."}
            {phase === "uploading" && "Uploading recording…"}
            {phase === "error" && (error ?? "Something went wrong.")}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="rec-language">Language</Label>
          <LanguageCombobox
            value={currentLanguage}
            onChange={changeLanguage}
            disabled={
              phase === "recording" ||
              phase === "uploading" ||
              phase === "requesting" ||
              updateLanguage.isPending
            }
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            AI generations from this recording - summary, flashcards, quizzes - will be in this language.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={cancel}
            disabled={phase === "uploading"}
          >
            Cancel
          </Button>
          {phase === "recording" ? (
            <Button type="button" onClick={stopAndUpload}>
              <HugeiconsIcon
                icon={StopCircleIcon}
                strokeWidth={2}
                className="size-4"
              />
              Stop & save
            </Button>
          ) : phase === "error" ? (
            <Button type="button" onClick={startRecording}>
              <HugeiconsIcon
                icon={Mic01Icon}
                strokeWidth={2}
                className="size-4"
              />
              Try again
            </Button>
          ) : (
            <Button
              type="button"
              onClick={startRecording}
              disabled={phase !== "idle"}
            >
              <HugeiconsIcon
                icon={Mic01Icon}
                strokeWidth={2}
                className="size-4"
              />
              {phase === "uploading" ? "Uploading…" : "Start recording"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
