"use client"

import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { AiChat01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@workspace/ui/lib/utils"

import { AiPanel } from "./ai-panel"

export function MobileChatFab({ notebookId }: { notebookId: string }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const historyPushedRef = useRef(false)

  useEffect(() => {
    if (open) setMounted(true)
  }, [open])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  // Wire the OS/browser back gesture to close the modal.
  useEffect(() => {
    if (!open) return
    window.history.pushState({ mobileChat: true }, "")
    historyPushedRef.current = true
    const onPopState = () => {
      historyPushedRef.current = false
      setOpen(false)
    }
    window.addEventListener("popstate", onPopState)
    return () => {
      window.removeEventListener("popstate", onPopState)
      // If we close via the in-app button (not back gesture), pop our entry
      // so it doesn't linger in history.
      if (historyPushedRef.current) {
        historyPushedRef.current = false
        window.history.back()
      }
    }
  }, [open])

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open chat"
        className={cn(
          "fixed right-4 bottom-20 z-40 flex size-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform active:scale-95",
          open && "pointer-events-none opacity-0",
        )}
      >
        <HugeiconsIcon icon={AiChat01Icon} strokeWidth={2} className="size-5" />
      </button>
      <div
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-50 flex flex-col bg-background transition-transform duration-200 ease-out",
          open ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
        style={{ height: "100dvh" }}
      >
        <div className="flex shrink-0 items-center justify-end border-b border-border px-2 py-1.5">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              strokeWidth={2}
              className="size-4"
            />
          </button>
        </div>
        <div className="min-h-0 flex-1">
          {mounted && <AiPanel notebookId={notebookId} />}
        </div>
      </div>
    </div>
  )
}
