"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  MinusSignIcon,
  PlusSignIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

import type { ZoomMode } from "./types"

const PRESETS = [50, 75, 100, 125, 150, 200, 300] as const

type PdfZoomMenuProps = {
  mode: ZoomMode
  effectiveScale: number
  onChange: (mode: ZoomMode) => void
}

export function PdfZoomMenu({ mode, effectiveScale, onChange }: PdfZoomMenuProps) {
  const label =
    mode.kind === "fit"
      ? "Page fit"
      : mode.kind === "width"
        ? "Page width"
        : `${Math.round(mode.value * 100)}%`
  const percent = Math.round(effectiveScale * 100)

  function step(delta: number) {
    const next = Math.max(0.1, Math.min(5, effectiveScale + delta / 100))
    onChange({ kind: "scale", value: next })
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 rounded-full border border-border bg-background px-3 text-xs font-medium tabular-nums"
          >
            {label}
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={2}
              className="size-3"
            />
          </Button>
        }
      />
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-56 gap-0 rounded-2xl p-2 text-sm"
      >
        <div className="flex items-center justify-between rounded-lg px-2 py-1.5">
          <span className="text-xs tabular-nums text-muted-foreground">
            {percent}%
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => step(-10)}
              aria-label="Zoom out"
            >
              <HugeiconsIcon
                icon={MinusSignIcon}
                strokeWidth={2}
                className="size-3.5"
              />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => step(10)}
              aria-label="Zoom in"
            >
              <HugeiconsIcon
                icon={PlusSignIcon}
                strokeWidth={2}
                className="size-3.5"
              />
            </Button>
          </div>
        </div>
        <ZoomItem
          label="Page width"
          active={mode.kind === "width"}
          onClick={() => onChange({ kind: "width" })}
        />
        <ZoomItem
          label="Page fit"
          active={mode.kind === "fit"}
          onClick={() => onChange({ kind: "fit" })}
        />
        <div className="my-1 h-px bg-border/60" />
        {PRESETS.map((p) => {
          const value = p / 100
          const active = mode.kind === "scale" && Math.abs(mode.value - value) < 0.001
          return (
            <ZoomItem
              key={p}
              label={`${p}%`}
              active={active}
              onClick={() => onChange({ kind: "scale", value })}
            />
          )
        })}
      </PopoverContent>
    </Popover>
  )
}

function ZoomItem({
  label,
  active,
  onClick,
}: {
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent",
        active && "font-medium",
      )}
    >
      <span>{label}</span>
      {active && (
        <HugeiconsIcon
          icon={Tick02Icon}
          strokeWidth={2}
          className="size-3.5 text-muted-foreground"
        />
      )}
    </button>
  )
}
