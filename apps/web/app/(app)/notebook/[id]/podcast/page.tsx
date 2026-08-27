"use client"

import { use, useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Mic01Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { KOKORO_VOICES, type KokoroVoiceId } from "@workspace/types"

import { AudioPlayer } from "@/components/sources/audio-player"
import {
  NoSourceTooltip,
  useHasNoSource,
} from "@/components/notebook/generate-button-guard"
import { VoicePickerDialog } from "@/components/podcast/voice-picker-dialog"
import {
  VOICE_BUBBLE_BG,
  VOICE_LABEL_COLOR,
} from "@/components/podcast/voice-tints"
import {
  useGeneratePodcast,
  usePodcast,
  usePodcastAudioUrl,
} from "@/lib/hooks/use-podcast"
import { useMe } from "@/lib/hooks/use-me"
import { triggerUpgradeModal } from "@/lib/upgrade-trigger"

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return ""
  const m = Math.round(seconds / 60)
  if (m < 1) return "<1 min"
  return `${m} min`
}

function voiceLabel(id: string): string {
  const v = KOKORO_VOICES.find((x) => x.id === id)
  return v ? v.label : id
}

export default function NotebookPodcastPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const podcastQuery = usePodcast(id)
  const generate = useGeneratePodcast(id)
  const noSource = useHasNoSource(id)
  const me = useMe()
  const isPro = me.data?.plan === "pro"
  const [pickerOpen, setPickerOpen] = useState(false)

  const podcast = podcastQuery.data ?? null
  const audioQuery = usePodcastAudioUrl(
    podcast && podcast.status === "ready" ? podcast.id : null,
  )

  async function handleSubmit(input: {
    voicePrimary: KokoroVoiceId
    voiceSecondary: KokoroVoiceId
  }) {
    await generate.mutateAsync(input)
    setPickerOpen(false)
    toast.success("Podcast queued - we'll have it ready in a few minutes.")
  }

  if (podcastQuery.isPending) {
    return (
      <div className="mx-auto max-w-3xl px-6 pt-8 pb-16">
        <PodcastSkeleton />
      </div>
    )
  }

  const status = podcast?.status ?? null
  const isInFlight = status === "pending" || status === "generating"

  return (
    <div className="mx-auto max-w-3xl px-6 pt-8 pb-16">
      {!podcast || status === "failed" ? (
        <EmptyState
          failed={status === "failed"}
          errorMessage={podcast?.errorMessage ?? null}
          noSource={noSource}
          notebookId={id}
          isPro={isPro}
          planLoading={me.isPending}
          onOpenPicker={() => setPickerOpen(true)}
        />
      ) : isInFlight ? (
        <InFlightState />
      ) : podcast.status === "ready" ? (
        <ReadyState
          audioUrl={audioQuery.data?.url ?? null}
          loadingAudio={audioQuery.isPending}
          durationSeconds={podcast.durationSeconds}
          voicePrimary={podcast.voicePrimary}
          voiceSecondary={podcast.voiceSecondary}
          script={podcast.script}
        />
      ) : null}

      <VoicePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        initialHost={podcast?.voicePrimary ?? null}
        initialGuest={podcast?.voiceSecondary ?? null}
        submitting={generate.isPending}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

function EmptyState({
  failed,
  errorMessage,
  noSource,
  notebookId,
  isPro,
  planLoading,
  onOpenPicker,
}: {
  failed: boolean
  errorMessage: string | null
  noSource: boolean
  notebookId: string
  isPro: boolean
  planLoading: boolean
  onOpenPicker: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <HugeiconsIcon icon={Mic01Icon} strokeWidth={2} className="size-6" />
      </span>
      <h2 className="text-base font-medium">
        {failed ? "Generation failed" : "Turn this notebook into a podcast"}
      </h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {failed
          ? errorMessage ??
            "Something went wrong while generating the podcast. Try again."
          : isPro || planLoading
            ? "Create immersive podcast conversations from your material, voiced by two AI speakers you select."
            : "Podcasts are a Pro feature. Upgrade to turn any notebook into a two-voice conversation you can listen to anywhere."}
      </p>
      {isPro || planLoading ? (
        <NoSourceTooltip notebookId={notebookId}>
          <Button
            type="button"
            size="sm"
            onClick={onOpenPicker}
            disabled={noSource || planLoading}
          >
            <HugeiconsIcon icon={Mic01Icon} strokeWidth={2} className="size-4" />
            {failed ? "Try again" : "Generate podcast"}
          </Button>
        </NoSourceTooltip>
      ) : (
        <Button
          type="button"
          size="sm"
          onClick={() =>
            triggerUpgradeModal({ kind: "pro_only", feature: "Podcasts" })
          }
        >
          Upgrade to Pro
        </Button>
      )}
    </div>
  )
}

function InFlightState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <HugeiconsIcon icon={Mic01Icon} strokeWidth={2} className="size-6" />
      </span>
      <div className="space-y-1">
        <h2 className="text-base font-medium">Generating your podcast…</h2>
        <p className="text-sm text-muted-foreground">
          This usually takes 2–4 minutes - feel free to come back later.
        </p>
      </div>
      <div className="mt-2 flex w-full max-w-md flex-col gap-2">
        <ShimmerBar />
        <Skeleton className="h-3 w-3/4 self-center rounded" />
        <Skeleton className="h-3 w-1/2 self-center rounded" />
      </div>
    </div>
  )
}

function ReadyState({
  audioUrl,
  loadingAudio,
  durationSeconds,
  voicePrimary,
  voiceSecondary,
  script,
}: {
  audioUrl: string | null
  loadingAudio: boolean
  durationSeconds: number | null
  voicePrimary: string
  voiceSecondary: string
  script: { speaker: "host" | "guest"; text: string }[] | null
}) {
  const duration = formatDuration(durationSeconds)
  const hostLabel = useMemo(() => voiceLabel(voicePrimary), [voicePrimary])
  const guestLabel = useMemo(() => voiceLabel(voiceSecondary), [voiceSecondary])
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-medium">Podcast</h1>
        <p className="text-xs text-muted-foreground">
          {hostLabel} (host) · {guestLabel} (guest)
          {duration ? ` · ${duration}` : ""}
        </p>
      </div>

      {audioUrl ? (
        <AudioPlayer src={audioUrl} />
      ) : loadingAudio ? (
        <Skeleton className="h-20 w-full rounded-2xl" />
      ) : (
        <p className="text-sm text-muted-foreground">
          Couldn't load audio. Try refreshing.
        </p>
      )}

      {script && script.length > 0 ? (
        <ScriptList
          script={script}
          hostLabel={hostLabel}
          guestLabel={guestLabel}
          voicePrimary={voicePrimary as KokoroVoiceId}
          voiceSecondary={voiceSecondary as KokoroVoiceId}
        />
      ) : null}
    </div>
  )
}

function ScriptList({
  script,
  hostLabel,
  guestLabel,
  voicePrimary,
  voiceSecondary,
}: {
  script: { speaker: "host" | "guest"; text: string }[]
  hostLabel: string
  guestLabel: string
  voicePrimary: KokoroVoiceId
  voiceSecondary: KokoroVoiceId
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Transcript
      </h2>
      <div className="space-y-3">
        {script.map((turn, i) => {
          const isHost = turn.speaker === "host"
          const voiceId = isHost ? voicePrimary : voiceSecondary
          return (
            <div
              key={i}
              className={cn(
                "rounded-2xl px-4 py-3 ring-1 ring-inset ring-border/60",
                VOICE_BUBBLE_BG[voiceId],
              )}
            >
              <div
                className={cn(
                  "mb-1 text-xs font-medium",
                  VOICE_LABEL_COLOR[voiceId],
                )}
              >
                {isHost ? hostLabel : guestLabel}
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {turn.text}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PodcastSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-1/3 rounded" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-4 w-1/2 rounded" />
      <Skeleton className="h-4 w-3/4 rounded" />
    </div>
  )
}

function ShimmerBar() {
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <span className="absolute inset-y-0 left-0 w-1/3 animate-[shimmer_1.4s_linear_infinite] bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(300%);
          }
        }
      `}</style>
    </div>
  )
}

