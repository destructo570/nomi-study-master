"use client"

import { createContext, useContext } from "react"
import type { Edge, Node } from "@xyflow/react"

export type NodeBranch = {
  /** 0 = root, 1 = main branch, 2+ = descendants. */
  depth: number
  /** Which main branch this node belongs to (cycles the palette). -1 for the root. */
  branchIndex: number
}

type BranchMap = Map<string, NodeBranch>

const MindmapBranchContext = createContext<BranchMap>(new Map())

export const MindmapBranchProvider = MindmapBranchContext.Provider

export function useNodeBranch(id: string): NodeBranch {
  const map = useContext(MindmapBranchContext)
  return map.get(id) ?? { depth: 0, branchIndex: -1 }
}

/**
 * Walk the edge graph to compute, for each node:
 *   - depth from the tree root (0 = root, 1 = main branch, ...)
 *   - the branch index (which depth-1 ancestor it descends from)
 *
 * Root = a node with no incoming edges. If the graph has multiple roots
 * (e.g. during editing, before connections are restored), each gets its own
 * subtree walked independently.
 */
export function computeBranches(nodes: Node[], edges: Edge[]): BranchMap {
  const parent = new Map<string, string>()
  const outgoing = new Map<string, string[]>()
  for (const n of nodes) outgoing.set(n.id, [])
  for (const e of edges) {
    parent.set(e.target, e.source)
    outgoing.get(e.source)?.push(e.target)
  }

  const result: BranchMap = new Map()
  const roots = nodes.filter((n) => !parent.has(n.id))

  for (const root of roots) {
    // Walk down through any single-child chain at the top of the tree
    // before assigning branch identity. The AI often produces a degenerate
    // tree (root → one "main topic" → many subtopics); without this hop,
    // every subtopic would share branchIndex 0 and render as the same hue.
    let trunkId = root.id
    let trunkDepth = 0
    result.set(trunkId, { depth: trunkDepth, branchIndex: -1 })
    while (true) {
      const kids = outgoing.get(trunkId) ?? []
      const onlyChild = kids.length === 1 ? kids[0] : undefined
      if (!onlyChild) break
      trunkDepth += 1
      result.set(onlyChild, { depth: trunkDepth, branchIndex: -1 })
      trunkId = onlyChild
    }

    const branchRoots = outgoing.get(trunkId) ?? []
    const queue: Array<{ id: string; depth: number; branchIndex: number }> = []
    branchRoots.forEach((childId, idx) => {
      queue.push({ id: childId, depth: trunkDepth + 1, branchIndex: idx })
    })
    while (queue.length) {
      const item = queue.shift()!
      if (result.has(item.id)) continue
      result.set(item.id, { depth: item.depth, branchIndex: item.branchIndex })
      for (const grandChild of outgoing.get(item.id) ?? []) {
        if (!result.has(grandChild)) {
          queue.push({
            id: grandChild,
            depth: item.depth + 1,
            branchIndex: item.branchIndex,
          })
        }
      }
    }
  }

  // Orphans (disconnected or cyclic remnants) get neutral styling.
  for (const n of nodes) {
    if (!result.has(n.id)) result.set(n.id, { depth: 0, branchIndex: -1 })
  }
  return result
}

/**
 * Pastel palette for branches. Each entry provides both a container tint and
 * a matching ring, and both modes look intentional. Cycled by branch index.
 */
export const BRANCH_PALETTES = [
  {
    bg: "bg-amber-100 dark:bg-amber-400/15",
    ring: "ring-amber-300/70 dark:ring-amber-400/40",
    hoverRing: "hover:ring-amber-400/80 dark:hover:ring-amber-300/60",
  },
  {
    bg: "bg-rose-100 dark:bg-rose-400/15",
    ring: "ring-rose-300/70 dark:ring-rose-400/40",
    hoverRing: "hover:ring-rose-400/80 dark:hover:ring-rose-300/60",
  },
  {
    bg: "bg-sky-100 dark:bg-sky-400/15",
    ring: "ring-sky-300/70 dark:ring-sky-400/40",
    hoverRing: "hover:ring-sky-400/80 dark:hover:ring-sky-300/60",
  },
  {
    bg: "bg-emerald-100 dark:bg-emerald-400/15",
    ring: "ring-emerald-300/70 dark:ring-emerald-400/40",
    hoverRing: "hover:ring-emerald-400/80 dark:hover:ring-emerald-300/60",
  },
  {
    bg: "bg-violet-100 dark:bg-violet-400/15",
    ring: "ring-violet-300/70 dark:ring-violet-400/40",
    hoverRing: "hover:ring-violet-400/80 dark:hover:ring-violet-300/60",
  },
  {
    bg: "bg-fuchsia-100 dark:bg-fuchsia-400/15",
    ring: "ring-fuchsia-300/70 dark:ring-fuchsia-400/40",
    hoverRing: "hover:ring-fuchsia-400/80 dark:hover:ring-fuchsia-300/60",
  },
] as const

/**
 * Root is intentionally neutral so it reads as the visual anchor. The ring is
 * slightly stronger so it still feels distinct from a leaf with no branch.
 */
export const ROOT_PALETTE = {
  bg: "bg-foreground",
  text: "text-background",
  ring: "ring-foreground/20 dark:ring-foreground/30",
  hoverRing: "hover:ring-foreground/40 dark:hover:ring-foreground/50",
} as const

/**
 * Deeper descendants fade slightly so the hierarchy stays legible even inside
 * a single branch. Returns an opacity utility that shrinks past depth 3.
 */
export function depthOpacity(depth: number): string {
  if (depth <= 1) return ""
  if (depth === 2) return ""
  if (depth === 3) return "opacity-95"
  return "opacity-90"
}
