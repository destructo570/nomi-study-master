"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Delete02Icon,
  FitToScreenIcon,
  FullscreenIcon,
  SquareArrowShrink01Icon,
} from "@hugeicons/core-free-icons"
import { nanoid } from "nanoid"

import { Button } from "@workspace/ui/components/button"
import { InsetFrame } from "@workspace/ui/components/inset-frame"
import { cn } from "@workspace/ui/lib/utils"

import { useUpdateMindmap } from "@/lib/hooks/use-mindmaps"
import type { Mindmap, MindmapData } from "@workspace/types"

import { MindmapNode, type MindmapNodeData } from "./mindmap-node"
import { MindmapBranchProvider, computeBranches } from "./mindmap-theme"

import "@xyflow/react/dist/style.css"
import "./mindmap-canvas.css"

const nodeTypes = { mindmap: MindmapNode }

const SAVE_DEBOUNCE_MS = 600

type Props = {
  mindmap: Mindmap
  notebookId: string
}

export function MindmapCanvas({ mindmap, notebookId }: Props) {
  const initial = useMemo<MindmapData>(
    () => ({
      nodes: mindmap.data.nodes.map((n) => ({ ...n, type: n.type ?? "mindmap" })),
      // Force every edge to the smooth bezier type so older mindmaps that
      // were persisted as "smoothstep" also render as curves.
      edges: mindmap.data.edges.map((e) => ({ ...e, type: "default" })),
    }),
    [mindmap.id],
  )
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<MindmapNodeData>>(
    initial.nodes as Node<MindmapNodeData>[],
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initial.edges as Edge[])
  const branchMap = useMemo(() => computeBranches(nodes, edges), [nodes, edges])
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const { fitView, screenToFlowPosition } = useReactFlow()

  const update = useUpdateMindmap(notebookId)

  const onConnect = useCallback(
    (conn: Connection) =>
      setEdges((eds) =>
        addEdge({ ...conn, id: `${conn.source}-${conn.target}`, type: "default" }, eds),
      ),
    [setEdges],
  )

  // Debounced persistence
  const lastSavedRef = useRef<string>(JSON.stringify(initial))
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const payload: MindmapData = {
      nodes: nodes.map((n) => ({
        id: n.id,
        position: n.position,
        data: { label: (n.data as MindmapNodeData).label ?? "" },
        type: n.type ?? "mindmap",
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type ?? "default",
      })),
    }
    const snapshot = JSON.stringify(payload)
    if (snapshot === lastSavedRef.current) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      lastSavedRef.current = snapshot
      update.mutate({ id: mindmap.id, data: payload })
    }, SAVE_DEBOUNCE_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [nodes, edges, mindmap.id, update])

  // Track fullscreen state from the browser (handles Esc too).
  useEffect(() => {
    function onChange() {
      setIsFullscreen(
        !!document.fullscreenElement &&
          document.fullscreenElement === containerRef.current,
      )
    }
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  async function toggleFullscreen() {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await el.requestFullscreen().catch(() => {
        // Some environments (Safari iOS) reject - fall back to a CSS overlay.
        setIsFullscreen((v) => !v)
      })
    }
  }

  function addNode() {
    const id = nanoid(8)
    const viewport = containerRef.current?.getBoundingClientRect()
    const center = viewport
      ? screenToFlowPosition({
          x: viewport.left + viewport.width / 2,
          y: viewport.top + viewport.height / 2,
        })
      : { x: 0, y: 0 }
    const selectedNode = nodes.find((n) => n.selected)
    const pos = selectedNode
      ? {
          x: selectedNode.position.x + 240,
          y: selectedNode.position.y,
        }
      : center
    const newNode: Node<MindmapNodeData> = {
      id,
      type: "mindmap",
      position: pos,
      data: { label: "New node" },
    }
    setNodes((nds) => [...nds, newNode])
    if (selectedNode) {
      setEdges((eds) =>
        addEdge(
          {
            id: `${selectedNode.id}-${id}`,
            source: selectedNode.id,
            target: id,
            type: "default",
          },
          eds,
        ),
      )
    }
  }

  function deleteSelected() {
    const selectedNodeIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id))
    const hasSelectedEdge = edges.some((e) => e.selected)
    if (selectedNodeIds.size === 0 && !hasSelectedEdge) return
    setNodes((nds) => nds.filter((n) => !selectedNodeIds.has(n.id)))
    setEdges((eds) =>
      eds.filter(
        (e) =>
          !e.selected &&
          !selectedNodeIds.has(e.source) &&
          !selectedNodeIds.has(e.target),
      ),
    )
  }

  return (
    <InsetFrame
      ref={containerRef}
      className={cn(
        "relative h-full w-full",
        isFullscreen && !document.fullscreenElement && "fixed inset-0 z-50 rounded-none border-0 p-0",
      )}
      innerClassName={cn(
        "mindmap-theme relative h-full w-full",
        isFullscreen && !document.fullscreenElement && "rounded-none",
      )}
    >
        <MindmapBranchProvider value={branchMap}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onMoveStart={() => setIsPanning(true)}
            onMoveEnd={() => setIsPanning(false)}
            fitView
            deleteKeyCode={["Backspace", "Delete"]}
            defaultEdgeOptions={{ type: "default", style: { strokeWidth: 1.5 } }}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1} />
            <MiniMap
              pannable
              zoomable
              className={cn(
                "transition-opacity duration-200 ease-out",
                isPanning ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            />
            <Controls showInteractive={false} />
          </ReactFlow>
        </MindmapBranchProvider>

        <div className="pointer-events-none absolute right-3 top-3 flex gap-2">
          <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-border bg-background p-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={addNode}
              title="Add node"
            >
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
              Add
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={deleteSelected}
              title="Delete selected (Backspace)"
              aria-label="Delete selected"
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => fitView({ duration: 250, padding: 0.2 })}
              title="Fit view"
              aria-label="Fit view"
            >
              <HugeiconsIcon icon={FitToScreenIcon} strokeWidth={2} className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              <HugeiconsIcon
                icon={isFullscreen ? SquareArrowShrink01Icon : FullscreenIcon}
                strokeWidth={2}
                className="size-4"
              />
            </Button>
          </div>
        </div>

        {nodes.length === 0 ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-auto flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-background/90 px-6 py-8 text-center text-sm text-muted-foreground">
              <p>This mindmap is empty.</p>
              <Button type="button" size="sm" onClick={addNode}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
                Add first node
              </Button>
            </div>
          </div>
        ) : null}
    </InsetFrame>
  )
}
