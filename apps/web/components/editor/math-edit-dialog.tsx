"use client"

import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import katex from "katex"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Textarea } from "@workspace/ui/components/textarea"

import {
  closeMathEdit,
  getMathEditSnapshot,
  subscribeMathEdit,
  type MathEditMode,
} from "./math-edit-store"

export function MathEditDialog() {
  const pending = useSyncExternalStore(
    subscribeMathEdit,
    getMathEditSnapshot,
    getMathEditSnapshot,
  )
  const [latex, setLatex] = useState("")
  const mode: MathEditMode = pending?.mode ?? "inline"

  useEffect(() => {
    setLatex(pending?.latex ?? "")
  }, [pending])

  const preview = useMemo(() => {
    if (!latex) return ""
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        displayMode: mode === "block",
        output: "html",
      })
    } catch {
      return ""
    }
  }, [latex, mode])

  function handleSave() {
    if (!pending) return
    const chain = pending.editor
      .chain()
      .focus()
      .setNodeSelection(pending.pos)
    if (mode === "inline") {
      chain.updateInlineMath({ latex }).run()
    } else {
      chain.updateBlockMath({ latex }).run()
    }
    closeMathEdit()
  }

  function handleRemove() {
    if (!pending) return
    pending.editor
      .chain()
      .focus()
      .setNodeSelection(pending.pos)
      .deleteSelection()
      .run()
    closeMathEdit()
  }

  return (
    <Dialog
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open) closeMathEdit()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "block" ? "Edit block formula" : "Edit inline formula"}
          </DialogTitle>
          <DialogDescription>
            Write LaTeX here - no surrounding dollar signs needed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Textarea
            autoFocus
            rows={4}
            value={latex}
            spellCheck={false}
            placeholder="E = mc^2"
            className="font-mono text-sm"
            onChange={(e) => setLatex(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault()
                handleSave()
              }
            }}
          />
          {preview ? (
            <div className="min-h-12 overflow-x-auto rounded-lg border bg-muted/40 p-3 text-center">
              {mode === "block" ? (
                <div className="block" dangerouslySetInnerHTML={{ __html: preview }} />
              ) : (
                <span className="inline" dangerouslySetInnerHTML={{ __html: preview }} />
              )}
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            className="text-destructive"
            onClick={handleRemove}
          >
            Remove
          </Button>
          <Button type="button" variant="outline" onClick={() => closeMathEdit()}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}