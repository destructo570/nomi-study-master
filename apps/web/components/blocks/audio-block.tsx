"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  HeadphonesIcon,
  PauseIcon,
  PlayIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components/progress"
import { cn } from "@workspace/ui/lib/utils"

type AudioBlockProps = {
  title?: string
  script: string
  segments?: string[]
  className?: string
}

export function AudioBlock({ title, script, segments, className }: AudioBlockProps) {
  const [playing, setPlaying] = useState(false)

  return (
    <Card className={cn("space-y-4 p-5", className)}>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <HugeiconsIcon icon={HeadphonesIcon} strokeWidth={2} className="size-3.5" />
        Audio {title ? `· ${title}` : ""}
      </div>

      <div className="flex items-center gap-3">
        <Button
          size="icon"
          variant="default"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : "Play"}
        >
          <HugeiconsIcon
            icon={playing ? PauseIcon : PlayIcon}
            strokeWidth={2}
            className="size-4"
          />
        </Button>
        <Progress value={playing ? 45 : 0} className="flex-1" />
        <span className="text-xs tabular-nums text-muted-foreground">
          {playing ? "1:23" : "0:00"} / 3:04
        </span>
      </div>

      {segments && segments.length > 0 && (
        <div className="space-y-1 rounded-xl bg-muted/60 p-4 text-sm">
          {segments.map((s, i) => (
            <p key={i} className="leading-relaxed">
              {s}
            </p>
          ))}
        </div>
      )}

      {!segments && (
        <p className="whitespace-pre-wrap rounded-xl bg-muted/60 p-4 text-sm leading-relaxed">
          {script}
        </p>
      )}
    </Card>
  )
}
