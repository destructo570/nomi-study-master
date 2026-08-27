"use client"

import { useEffect, useRef, useState } from "react"
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react"

import { cn } from "@workspace/ui/lib/utils"

import {
  BRANCH_PALETTES,
  ROOT_PALETTE,
  depthOpacity,
  useNodeBranch,
} from "./mindmap-theme"

export type MindmapNodeData = {
  label: string
}

export function MindmapNode({ id, data, selected }: NodeProps) {
  const label = (data as MindmapNodeData).label ?? ""
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(label)
  const inputRef = useRef<HTMLInputElement>(null)
  const { updateNodeData } = useReactFlow()
  const { depth, branchIndex } = useNodeBranch(id)

  useEffect(() => {
    setDraft(label)
  }, [label])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function commit() {
    const next = draft.trim()
    if (!next) {
      setDraft(label)
      setEditing(false)
      return
    }
    if (next !== label) {
      updateNodeData(id, { label: next })
    }
    setEditing(false)
  }

  function cancel() {
    setDraft(label)
    setEditing(false)
  }

  const isRoot = depth === 0
  // Trunk nodes (single-child spine before the first real branching point)
  // share branchIndex -1 with the root and inherit the same neutral styling.
  const isTrunk = branchIndex < 0
  const palette = isTrunk
    ? null
    : BRANCH_PALETTES[branchIndex % BRANCH_PALETTES.length]

  const handleClass = cn(
    "!size-2.5 !border !border-border !bg-background !opacity-0 transition-opacity",
    "group-hover:!opacity-100",
    selected && "!opacity-100",
  )

  return (
    <div
      data-selected={selected ? "true" : "false"}
      className={cn(
        "group relative min-w-[140px] rounded-xl px-4 py-3 shadow-md ring-1 transition",
        depthOpacity(depth),
        isTrunk
          ? cn(ROOT_PALETTE.bg, ROOT_PALETTE.text, ROOT_PALETTE.ring)
          : palette && cn(palette.bg, palette.ring, "text-foreground"),
        selected
          ? "ring-2 ring-primary/50"
          : isTrunk
            ? ROOT_PALETTE.hoverRing
            : palette?.hoverRing,
      )}
      onDoubleClick={(e) => {
        e.stopPropagation()
        setEditing(true)
      }}
    >
      <Handle type="target" position={Position.Left} className={handleClass} />
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              commit()
            } else if (e.key === "Escape") {
              e.preventDefault()
              cancel()
            }
          }}
          className={cn(
            "w-full min-w-[160px] bg-transparent font-heading text-base font-medium leading-5 outline-none",
            isTrunk ? "text-background" : "text-foreground",
          )}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className={cn(
            "block max-w-[260px] truncate font-heading leading-5",
            isRoot
              ? "text-[0.95rem] font-semibold"
              : depth === 1
                ? "text-base font-semibold"
                : "text-sm font-medium",
          )}
        >
          {label || "Untitled"}
        </span>
      )}
      <Handle type="source" position={Position.Right} className={handleClass} />
    </div>
  )
}
