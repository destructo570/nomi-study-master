"use client"

import { Card } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

type VideoPlayerProps = {
  src: string
  className?: string
}

export function VideoPlayer({ src, className }: VideoPlayerProps) {
  return (
    <Card className={cn("overflow-hidden p-0", className)}>
      <video
        src={src}
        controls
        preload="metadata"
        controlsList="nodownload"
        className="aspect-video w-full bg-black"
      />
    </Card>
  )
}
