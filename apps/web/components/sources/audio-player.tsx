"use client"

import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PauseIcon,
  PlayIcon,
  VolumeHighIcon,
  VolumeMute02Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { InsetFrame } from "@workspace/ui/components/inset-frame"
import { Slider } from "@workspace/ui/components/slider"
import { cn } from "@workspace/ui/lib/utils"

type AudioPlayerProps = {
  src: string
  className?: string
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m)
  const ss = String(s).padStart(2, "0")
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export function AudioPlayer({ src, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [muted, setMuted] = useState(false)
  const [seeking, setSeeking] = useState(false)
  const [seekValue, setSeekValue] = useState(0)

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.playbackRate = speed
  }, [speed])

  function togglePlay() {
    const el = audioRef.current
    if (!el) return
    if (el.paused) {
      void el.play()
    } else {
      el.pause()
    }
  }

  function toggleMute() {
    const el = audioRef.current
    if (!el) return
    el.muted = !el.muted
    setMuted(el.muted)
  }

  function onSeekChange(v: number | readonly number[]) {
    const value = typeof v === "number" ? v : (v[0] ?? 0)
    setSeeking(true)
    setSeekValue(value)
  }

  function onSeekCommit(v: number | readonly number[]) {
    const value = typeof v === "number" ? v : (v[0] ?? 0)
    const el = audioRef.current
    if (el && Number.isFinite(value)) {
      el.currentTime = value
      setCurrent(value)
    }
    setSeeking(false)
  }

  const displayTime = seeking ? seekValue : current

  return (
    <InsetFrame className={className} innerClassName="space-y-3 p-4">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => {
          if (!seeking) setCurrent(e.currentTarget.currentTime)
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      <div className="flex items-center gap-3">
        <Button
          size="icon"
          variant="default"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          className="shrink-0"
        >
          <HugeiconsIcon
            icon={playing ? PauseIcon : PlayIcon}
            strokeWidth={2}
            className="size-4"
          />
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
            {formatTime(displayTime)}
          </span>
          <Slider
            min={0}
            max={Math.max(duration, 0.0001)}
            step={0.1}
            value={[displayTime]}
            onValueChange={onSeekChange}
            onValueCommitted={onSeekCommit}
            disabled={!duration}
            className="flex-1"
            aria-label="Seek"
          />
          <span className="w-10 shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatTime(duration)}
          </span>
        </div>

        <Button
          size="icon-sm"
          variant="ghost"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="shrink-0"
        >
          <HugeiconsIcon
            icon={muted ? VolumeMute02Icon : VolumeHighIcon}
            strokeWidth={2}
            className="size-4"
          />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                size="sm"
                variant="ghost"
                aria-label="Playback speed"
                className="shrink-0 px-2 text-xs tabular-nums"
              >
                {speed}×
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="min-w-20">
            {SPEEDS.map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => setSpeed(s)}
                className={cn(
                  "justify-end text-xs tabular-nums",
                  s === speed && "font-semibold",
                )}
              >
                {s}×
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </InsetFrame>
  )
}
