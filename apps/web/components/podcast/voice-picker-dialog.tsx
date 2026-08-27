"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PauseIcon, PlayIcon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { cn } from "@workspace/ui/lib/utils"
import { KOKORO_VOICES, type KokoroVoiceId } from "@workspace/types"

import { VOICE_AVATAR_TINT } from "./voice-tints"

type Speaker = "host" | "guest"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialHost?: KokoroVoiceId | null
  initialGuest?: KokoroVoiceId | null
  submitting?: boolean
  onSubmit: (input: {
    voicePrimary: KokoroVoiceId
    voiceSecondary: KokoroVoiceId
  }) => Promise<void> | void
}

export function VoicePickerDialog({
  open,
  onOpenChange,
  initialHost,
  initialGuest,
  submitting = false,
  onSubmit,
}: Props) {
  const [host, setHost] = useState<KokoroVoiceId | null>(initialHost ?? null)
  const [guest, setGuest] = useState<KokoroVoiceId | null>(initialGuest ?? null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingId, setPlayingId] = useState<KokoroVoiceId | null>(null)

  // Reset selections to the latest persisted values whenever the dialog
  // reopens - keeps regenerate flows seeded with the user's last picks.
  useEffect(() => {
    if (open) {
      setHost(initialHost ?? null)
      setGuest(initialGuest ?? null)
    } else {
      const el = audioRef.current
      if (el) {
        el.pause()
        el.currentTime = 0
      }
      setPlayingId(null)
    }
  }, [open, initialHost, initialGuest])

  function togglePreview(voiceId: KokoroVoiceId) {
    const el = audioRef.current
    if (!el) return
    if (playingId === voiceId) {
      el.pause()
      setPlayingId(null)
      return
    }
    el.pause()
    el.src = `/audio/${voiceId}.mp3`
    el.currentTime = 0
    void el
      .play()
      .then(() => setPlayingId(voiceId))
      .catch(() => {
        toast.error(
          "Voice preview not available yet - generate to hear the real thing.",
        )
        setPlayingId(null)
      })
  }

  const canSubmit = useMemo(
    () => !!host && !!guest && host !== guest && !submitting,
    [host, guest, submitting],
  )

  async function handleSubmit() {
    if (!host || !guest) return
    try {
      await onSubmit({ voicePrimary: host, voiceSecondary: guest })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start podcast")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pick your hosts</DialogTitle>
          <DialogDescription>
            Choose a Host voice and a Guest voice. They should feel different
            enough to follow along by ear.
          </DialogDescription>
        </DialogHeader>

        <audio
          ref={audioRef}
          preload="none"
          onEnded={() => setPlayingId(null)}
          onPause={() => {
            // Browsers fire onPause for both manual pauses and src changes;
            // only clear the playing id when we're truly idle.
            const el = audioRef.current
            if (!el || el.paused) setPlayingId((prev) => (prev ? null : prev))
          }}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <VoiceColumn
            label="Host"
            selected={host}
            onSelect={setHost}
            playingId={playingId}
            onTogglePreview={togglePreview}
          />
          <VoiceColumn
            label="Guest"
            selected={guest}
            onSelect={setGuest}
            playingId={playingId}
            onTogglePreview={togglePreview}
          />
        </div>

        {host && guest && host === guest && (
          <p className="text-xs text-destructive">
            Host and Guest must be different voices.
          </p>
        )}

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="w-full sm:w-auto"
          >
            {submitting ? "Starting…" : "Generate podcast"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function VoiceColumn({
  label,
  selected,
  onSelect,
  playingId,
  onTogglePreview,
}: {
  label: Speaker | string
  selected: KokoroVoiceId | null
  onSelect: (id: KokoroVoiceId) => void
  playingId: KokoroVoiceId | null
  onTogglePreview: (id: KokoroVoiceId) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="grid gap-1.5">
        {KOKORO_VOICES.map((v) => {
          const isSelected = selected === v.id
          const isPlaying = playingId === v.id
          return (
            <div
              key={`${label}-${v.id}`}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-border bg-background p-2 pr-1.5 transition-colors",
                isSelected && "border-foreground/40 bg-accent/50",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(v.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                aria-pressed={isSelected}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                    VOICE_AVATAR_TINT[v.id],
                  )}
                >
                  {v.label[0]}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {v.label}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {v.accent} · {v.gender}
                  </span>
                </span>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={isPlaying ? `Pause ${v.label} preview` : `Play ${v.label} preview`}
                onClick={() => onTogglePreview(v.id)}
                className="shrink-0"
              >
                <HugeiconsIcon
                  icon={isPlaying ? PauseIcon : PlayIcon}
                  strokeWidth={2}
                  className="size-4"
                />
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
