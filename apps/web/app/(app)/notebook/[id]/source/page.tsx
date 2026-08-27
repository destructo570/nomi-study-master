"use client"

import { Suspense, use, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert01Icon,
  Delete02Icon,
  Mic01Icon,
  PlusSignIcon,
  ReloadIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import type { Source } from "@workspace/types"
import { SUPPORTED_UPLOAD_MIMES } from "@workspace/types"
import {
  type LanguageCode,
  normalizeLanguage,
} from "@workspace/types/language"

import { ArtifactLanguageSwitcher } from "@/components/notebook/artifact-language-switcher"
import {
  SourceDialog,
  type SourceDialogSubmit,
} from "@/components/sources/source-dialog"
import { SourceEditor } from "@/components/sources/source-editor"
import { RecordAudioDialog } from "@/components/sources/record-audio-dialog"
import {
  useAddSource,
  useDeleteSource,
  useRetrySource,
  useSources,
  useTranslateSource,
  useUploadSourceFile,
} from "@/lib/hooks/use-sources"
import { useDefaultLanguage } from "@/lib/hooks/use-me"

function VercelSpinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("vercel-spinner size-3.5", className)}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          style={{
            transform: `translateX(-50%) rotate(${i * 30}deg)`,
            animationDelay: `${-1.1 + i * 0.1}s`,
          }}
        />
      ))}
    </span>
  )
}

function ProcessingChip() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
      <VercelSpinner />
      Processing
    </span>
  )
}

function FailedChip() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive">
      <HugeiconsIcon icon={Alert01Icon} strokeWidth={2} className="size-3.5" />
      Failed
    </span>
  )
}

function NotebookSourceContent({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const sourcesQuery = useSources(id)
  const addSource = useAddSource(id)
  const uploadSourceFile = useUploadSourceFile(id)
  const retrySource = useRetrySource(id)
  const deleteSource = useDeleteSource(id)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [sourceOpen, setSourceOpen] = useState(false)
  const [recordOpen, setRecordOpen] = useState(false)
  const [recordAutoStart, setRecordAutoStart] = useState(false)

  // Honor the ?record=1 deep-link from the home page Record quick action.
  // Strip the param after handling so a refresh doesn't re-trigger.
  useEffect(() => {
    if (!searchParams) return
    if (searchParams.get("record") !== "1") return
    setRecordAutoStart(true)
    setRecordOpen(true)
    const params = new URLSearchParams(searchParams.toString())
    params.delete("record")
    const qs = params.toString()
    router.replace(`/notebook/${id}/source${qs ? `?${qs}` : ""}`)
  }, [searchParams, router, id])

  const sources = sourcesQuery.data ?? []
  const active = sources[0] ?? null
  const isLoading = sourcesQuery.isPending
  const isProcessing =
    active?.status === "processing" || active?.status === "pending_upload"
  const isFailed = active?.status === "failed"
  const isPdf =
    active?.type === "file" &&
    active.status === "ready" &&
    active.mimeType === SUPPORTED_UPLOAD_MIMES.pdf

  // Language switcher state lives on the page so the dropdown can sit in
  // the title row alongside the source title. The "original" view shows
  // source.content (editable); other languages render translations[code]
  // read-only inside SourceEditor.
  const userLanguage = useDefaultLanguage()
  const translate = useTranslateSource(id)
  const originalLanguage = normalizeLanguage(userLanguage)
  const availableLanguages = useMemo<LanguageCode[]>(() => {
    if (!active) return [originalLanguage]
    const fromTranslations = Object.keys(active.translations ?? {})
      .filter((k) => k !== originalLanguage)
      .map((k) => normalizeLanguage(k))
    return [originalLanguage, ...fromTranslations]
  }, [active, originalLanguage])
  const [viewLanguage, setViewLanguage] = useState<LanguageCode>(originalLanguage)
  useEffect(() => {
    // Snap back to original when the available list no longer contains
    // the previously-selected translation (e.g. source switched).
    if (!availableLanguages.includes(viewLanguage)) {
      setViewLanguage(originalLanguage)
    }
  }, [availableLanguages, viewLanguage, originalLanguage])

  const canTranslate =
    !!active &&
    !isPdf &&
    active.status === "ready" &&
    (active.content?.trim().length ?? 0) > 0

  async function handleTranslate(target: LanguageCode) {
    if (!active) return
    try {
      await translate.mutateAsync({ id: active.id, targetLanguage: target })
      setViewLanguage(target)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to translate source"
      toast.error(msg)
    }
  }

  async function handleSubmit(input: SourceDialogSubmit) {
    if (input.type === "file") {
      await uploadSourceFile.mutateAsync({
        file: input.file,
        title: input.title,
      })
      toast.success("Upload started - we'll process this in the background.")
    } else if (input.type === "url") {
      await addSource.mutateAsync({
        type: "url",
        url: input.url,
        title: input.title,
      })
      toast.success("Fetching the page - we'll add it once the text is extracted.")
    } else {
      await addSource.mutateAsync({
        type: "text",
        title: input.title,
        content: input.content,
      })
    }
  }

  async function handleRetry(sourceId: string) {
    try {
      await retrySource.mutateAsync(sourceId)
      toast.success("Retrying - the file is back in the processing queue.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Retry failed")
    }
  }

  async function handleDelete(sourceId: string) {
    try {
      await deleteSource.mutateAsync(sourceId)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    }
  }

  return (
    <div
      className={cn(
        "mx-auto max-w-5xl",
        isPdf
          ? "flex h-full min-h-0 min-w-0 flex-col px-2 pb-2"
          : "px-8 pt-8 pb-16",
      )}
    >
      {!isPdf && (
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="min-w-0 space-y-1">
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-48 rounded-md" />
                <Skeleton className="mt-2 h-4 w-64 rounded-md" />
              </>
            ) : (
              <>
                <h2 className="truncate text-2xl font-semibold tracking-tight">
                  {active && active.status === "ready" ? active.title : "Source"}
                </h2>
                <p className="truncate text-sm text-muted-foreground">
                  {active && active.status === "ready"
                    ? (active.fileName ?? "")
                    : "Everything the AI uses to ground its answers."}
                </p>
              </>
            )}
          </div>
          {isLoading ? null : isProcessing ? (
            <ProcessingChip />
          ) : isFailed && active ? (
            <div className="flex items-center gap-2">
              <FailedChip />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleDelete(active.id)}
                      aria-label="Delete source"
                    >
                      <HugeiconsIcon
                        icon={Delete02Icon}
                        strokeWidth={2}
                        className="size-4"
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete source</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ) : !active ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRecordAutoStart(false)
                  setRecordOpen(true)
                }}
              >
                <HugeiconsIcon
                  icon={Mic01Icon}
                  strokeWidth={2}
                  className="size-4"
                />
                Record
              </Button>
              <Button size="sm" onClick={() => setSourceOpen(true)}>
                <HugeiconsIcon
                  icon={PlusSignIcon}
                  strokeWidth={2}
                  className="size-4"
                />
                Add source
              </Button>
            </div>
          ) : canTranslate ? (
            <ArtifactLanguageSwitcher
              value={viewLanguage}
              available={availableLanguages}
              onSelect={setViewLanguage}
              onTranslate={handleTranslate}
              pending={translate.isPending}
            />
          ) : null}
        </div>
      )}

      {isLoading ? (
        <SourceSkeleton />
      ) : active ? (
        <SourceBody
          notebookId={id}
          source={active}
          onRetry={() => handleRetry(active.id)}
          retrying={retrySource.isPending}
          fillHeight={isPdf}
          viewLanguage={viewLanguage}
          originalLanguage={originalLanguage}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No source yet. Add text, paste a YouTube URL, or upload a file.
          </p>
        </div>
      )}

      <SourceDialog
        open={sourceOpen}
        onOpenChange={setSourceOpen}
        onSubmit={handleSubmit}
      />
      <RecordAudioDialog
        notebookId={id}
        open={recordOpen}
        onOpenChange={(next) => {
          setRecordOpen(next)
          if (!next) setRecordAutoStart(false)
        }}
        autoStart={recordAutoStart}
      />
    </div>
  )
}

function SourceSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-2/3 rounded-md" />
      <Skeleton className="h-4 w-full rounded-md" />
      <Skeleton className="h-4 w-[92%] rounded-md" />
      <Skeleton className="h-4 w-[88%] rounded-md" />
      <Skeleton className="h-4 w-3/4 rounded-md" />
      <div className="h-2" />
      <Skeleton className="h-5 w-1/2 rounded-md" />
      <Skeleton className="h-4 w-full rounded-md" />
      <Skeleton className="h-4 w-[95%] rounded-md" />
      <Skeleton className="h-4 w-[85%] rounded-md" />
    </div>
  )
}

function SourceBody({
  notebookId,
  source,
  onRetry,
  retrying,
  fillHeight,
  viewLanguage,
  originalLanguage,
}: {
  notebookId: string
  source: Source
  onRetry: () => void
  retrying: boolean
  fillHeight?: boolean
  viewLanguage?: LanguageCode
  originalLanguage?: LanguageCode
}) {
  const isAsync =
    source.type === "file" ||
    source.type === "youtube" ||
    source.type === "article"
  const isProcessing =
    isAsync &&
    (source.status === "processing" || source.status === "pending_upload")
  const isFailed = isAsync && source.status === "failed"

  if (isFailed) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Processing failed: {source.errorMessage ?? "unknown error"}
        </div>
        <Button
          size="sm"
          onClick={onRetry}
          disabled={retrying}
          className="gap-1.5"
        >
          <HugeiconsIcon
            icon={ReloadIcon}
            strokeWidth={2}
            className={cn("size-4", retrying && "animate-spin")}
          />
          {retrying ? "Retrying…" : "Retry"}
        </Button>
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
        {source.status === "pending_upload"
          ? "Uploading file…"
          : source.type === "youtube"
            ? "Fetching the YouTube transcript…"
            : source.type === "article"
              ? "Scraping the article…"
              : "Processing - extracting text or transcribing audio. Please wait or come back after some time."}
      </div>
    )
  }

  return (
    <SourceEditor
      key={source.id}
      notebookId={notebookId}
      source={source}
      fillHeight={fillHeight}
      viewLanguage={viewLanguage}
      originalLanguage={originalLanguage}
    />
  )
}

export default function NotebookSourcePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense fallback={null}>
      <NotebookSourceContent params={params} />
    </Suspense>
  )
}
