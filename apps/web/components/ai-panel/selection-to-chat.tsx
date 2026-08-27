"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { cn } from "@workspace/ui/lib/utils"

export const ADD_TO_CHAT_EVENT = "notebook-ai:add-context"

export type AddToChatDetail = {
  text: string
}

type Pos = { top: number; left: number }

type SelectionToChatProps = {
  children: React.ReactNode
  className?: string
}

export function SelectionToChat({ children, className }: SelectionToChatProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<Pos | null>(null)
  const selectedRef = useRef<string>("")

  const hide = useCallback(() => setPos(null), [])

  const dispatchAddToChat = useCallback(() => {
    const text = selectedRef.current
    if (!text) return false
    window.dispatchEvent(
      new CustomEvent<AddToChatDetail>(ADD_TO_CHAT_EVENT, {
        detail: { text },
      }),
    )
    window.getSelection()?.removeAllRanges()
    selectedRef.current = ""
    hide()
    return true
  }, [hide])

  useEffect(() => {
    function readSelection() {
      const container = containerRef.current
      if (!container) return
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        hide()
        return
      }
      const range = sel.getRangeAt(0)
      if (!container.contains(range.commonAncestorContainer)) {
        hide()
        return
      }
      const text = sel.toString().trim()
      if (text.length < 3) {
        hide()
        return
      }
      const rect = range.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) {
        hide()
        return
      }
      selectedRef.current = text
      // Estimate button size so we can keep it inside the viewport.
      // The button is ~32px tall and ~140px wide; transform centres it on `left`.
      const buttonHeight = 32
      const buttonHalfWidth = 70
      const edgePadding = 8
      const placeAbove = rect.top - buttonHeight - edgePadding
      const top =
        placeAbove < edgePadding ? rect.bottom + edgePadding : placeAbove
      const centerX = rect.left + rect.width / 2
      const minLeft = buttonHalfWidth + edgePadding
      const maxLeft = window.innerWidth - buttonHalfWidth - edgePadding
      const left = Math.min(Math.max(centerX, minLeft), maxLeft)
      setPos({ top, left })
    }

    function selectionInsideContainer() {
      const container = containerRef.current
      if (!container) return false
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return false
      const range = sel.getRangeAt(0)
      if (!container.contains(range.commonAncestorContainer)) return false
      return sel.toString().trim().length >= 3
    }

    function handleMouseUp() {
      window.setTimeout(readSelection, 0)
    }
    function handleKeyUp(e: KeyboardEvent) {
      if (e.shiftKey || e.key === "Shift" || e.key.startsWith("Arrow")) {
        window.setTimeout(readSelection, 0)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "l") {
        if (!selectionInsideContainer()) return
        e.preventDefault()
        dispatchAddToChat()
      }
    }

    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("keyup", handleKeyUp)
    document.addEventListener("keydown", handleKeyDown)
    const container = containerRef.current
    container?.addEventListener("scroll", hide, true)
    window.addEventListener("resize", hide)
    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("keyup", handleKeyUp)
      document.removeEventListener("keydown", handleKeyDown)
      container?.removeEventListener("scroll", hide, true)
      window.removeEventListener("resize", hide)
    }
  }, [hide, dispatchAddToChat])

  function handleAddToChat(e: React.MouseEvent) {
    e.preventDefault()
    dispatchAddToChat()
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {children}
      {pos && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleAddToChat}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            transform: "translateX(-50%)",
          }}
          className="z-50 inline-flex items-center gap-2 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background shadow-lg ring-1 ring-foreground/20 hover:bg-foreground/90"
        >
          Add to chat
          <span className="text-background/60">⌘ L</span>
        </button>
      )}
    </div>
  )
}
