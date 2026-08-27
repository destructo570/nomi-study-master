"use client"

import Avatar from "boring-avatars"

import { cn } from "@workspace/ui/lib/utils"

const PASTEL_COLORS = [
  "#FFB89A",
  "#A8BCFF",
  "#BAA5FF",
  "#A0E8BD",
  "#FCE17C",
]

type UserAvatarProps = {
  name: string
  size: number
  className?: string
}

export function UserAvatar({ name, size, className }: UserAvatarProps) {
  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-full ring-1 ring-foreground/5",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Avatar
        size={size}
        name={name || "nomi"}
        variant="beam"
        colors={PASTEL_COLORS}
      />
    </div>
  )
}
