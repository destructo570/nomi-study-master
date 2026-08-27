"use client"

import { useEffect, useMemo } from "react"
import {
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react"
import { motion } from "framer-motion"

import { cn } from "@workspace/ui/lib/utils"

import type { MindmapNodeData } from "@/components/notebook/mindmap-node"
import {
  BRANCH_PALETTES,
  ROOT_PALETTE,
  MindmapBranchProvider,
  computeBranches,
  depthOpacity,
  useNodeBranch,
} from "@/components/notebook/mindmap-theme"

import "@xyflow/react/dist/style.css"
import "@/components/notebook/mindmap-canvas.css"

function MindmapPreviewNode({ id, data }: NodeProps) {
  const label = (data as MindmapNodeData).label ?? ""
  const { depth, branchIndex } = useNodeBranch(id)

  const isRoot = depth === 0
  const isTrunk = branchIndex < 0
  const palette = isTrunk
    ? null
    : BRANCH_PALETTES[branchIndex % BRANCH_PALETTES.length]

  return (
    <div
      className={cn(
        "group relative min-w-[42px] max-w-[80px] rounded-full px-2 py-0.5 text-center shadow-sm ring-[0.5px] transition",
        depthOpacity(depth),
        isTrunk
          ? cn(ROOT_PALETTE.bg, ROOT_PALETTE.text, ROOT_PALETTE.ring)
          : palette && cn(palette.bg, palette.ring, "text-foreground"),
        isRoot
          ? "text-[6px] font-semibold"
          : "text-[5px] font-medium"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-1 !border-0 !bg-transparent !opacity-0"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="source-left"
        className="!size-1 !border-0 !bg-transparent !opacity-0"
      />
      <span className="block truncate font-heading leading-tight">
        {label || "Untitled"}
      </span>
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!size-1 !border-0 !bg-transparent !opacity-0"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="target-right"
        className="!size-1 !border-0 !bg-transparent !opacity-0"
      />
    </div>
  )
}

const nodeTypes = { mindmap: MindmapPreviewNode }

const NODES: Node<MindmapNodeData>[] = [
  { id: "root", type: "mindmap", position: { x: 0, y: 0 }, data: { label: "Cellular Biology" } },
  { id: "energy", type: "mindmap", position: { x: -95, y: -40 }, data: { label: "Energy" } },
  { id: "atp", type: "mindmap", position: { x: -95, y: 0 }, data: { label: "ATP" } },
  { id: "membranes", type: "mindmap", position: { x: -95, y: 40 }, data: { label: "Membranes" } },
  { id: "dna", type: "mindmap", position: { x: 95, y: -40 }, data: { label: "DNA" } },
  { id: "organelles", type: "mindmap", position: { x: 95, y: 0 }, data: { label: "Organelles" } },
  { id: "proteins", type: "mindmap", position: { x: 95, y: 40 }, data: { label: "Proteins" } },
]

const EDGES: Edge[] = [
  { id: "root-energy", source: "root", sourceHandle: "source-left", target: "energy", targetHandle: "target-right", type: "default" },
  { id: "root-atp", source: "root", sourceHandle: "source-left", target: "atp", targetHandle: "target-right", type: "default" },
  { id: "root-membranes", source: "root", sourceHandle: "source-left", target: "membranes", targetHandle: "target-right", type: "default" },
  { id: "root-dna", source: "root", sourceHandle: "source-right", target: "dna", type: "default" },
  { id: "root-organelles", source: "root", sourceHandle: "source-right", target: "organelles", type: "default" },
  { id: "root-proteins", source: "root", sourceHandle: "source-right", target: "proteins", type: "default" },
]

// Compact layout for narrow / full-width mobile+tablet views: one main node on
// the left with three branches connected to it on the right.
const COMPACT_NODES: Node<MindmapNodeData>[] = [
  { id: "root", type: "mindmap", position: { x: -70, y: 0 }, data: { label: "Cellular Biology" } },
  { id: "dna", type: "mindmap", position: { x: 90, y: -60 }, data: { label: "DNA" } },
  { id: "organelles", type: "mindmap", position: { x: 90, y: 0 }, data: { label: "Organelles" } },
  { id: "proteins", type: "mindmap", position: { x: 90, y: 60 }, data: { label: "Proteins" } },
]

const COMPACT_EDGES: Edge[] = [
  { id: "root-dna", source: "root", sourceHandle: "source-right", target: "dna", type: "default" },
  { id: "root-organelles", source: "root", sourceHandle: "source-right", target: "organelles", type: "default" },
  { id: "root-proteins", source: "root", sourceHandle: "source-right", target: "proteins", type: "default" },
]

function MindmapFlow({ active, compact }: { active: boolean; compact: boolean }) {
  const nodes = compact ? COMPACT_NODES : NODES
  const edges = compact ? COMPACT_EDGES : EDGES
  const branchMap = useMemo(() => computeBranches(nodes, edges), [compact])
  const [edgeState, setEdges] = useEdgesState(edges)

  useEffect(() => {
    setEdges(edges)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact])

  useEffect(() => {
    setEdges((eds) => eds.map((e) => ({ ...e, animated: active })))
  }, [active, setEdges])

  return (
    <MindmapBranchProvider value={branchMap}>
      <div className="absolute inset-0 -translate-y-10">
        <ReactFlow
          nodes={nodes}
          edges={edgeState}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesFocusable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          selectionOnDrag={false}
          selectNodesOnDrag={false}
          fitView
          fitViewOptions={{
            padding: compact
              ? { top: 0.3, right: 0.3, bottom: 0.3, left: 0.3 }
              : { top: 0.2, right: 0.35, bottom: 0.35, left: 0.35 },
            duration: 300,
          }}
          defaultEdgeOptions={{ type: "default", style: { strokeWidth: 0.75 } }}
          proOptions={{ hideAttribution: true }}
        >
        </ReactFlow>
      </div>
    </MindmapBranchProvider>
  )
}

export function MindmapPreview({
  active,
  compact = false,
  className,
}: {
  active: boolean
  compact?: boolean
  className?: string
}) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: active ? 1 : 0.9, scale: active ? 1 : 0.99 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "mindmap-theme mindmap-preview pointer-events-none relative h-full w-full overflow-hidden",
        className
      )}
    >
      <ReactFlowProvider>
        <MindmapFlow active={active} compact={compact} />
      </ReactFlowProvider>
    </motion.div>
  )
}
