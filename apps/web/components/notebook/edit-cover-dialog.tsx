"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

import { CoverPicker } from "@/components/notebook/cover-picker"
import { useUpdateNotebookCover } from "@/lib/hooks/use-workspace"

type EditCoverDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  notebookId: string | null
  currentCover?: string
  fallbackCover: string
}

export function EditCoverDialog({
  open,
  onOpenChange,
  notebookId,
  currentCover,
  fallbackCover,
}: EditCoverDialogProps) {
  const initial = currentCover ?? fallbackCover
  const [selected, setSelected] = useState(initial)
  const updateCover = useUpdateNotebookCover()

  useEffect(() => {
    if (open) setSelected(currentCover ?? fallbackCover)
  }, [open, currentCover, fallbackCover])

  const dirty = selected !== currentCover

  async function save() {
    if (!notebookId) return
    try {
      await updateCover.mutateAsync({ id: notebookId, cover: selected })
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update cover")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Change cover</DialogTitle>
          <DialogDescription>
            Pick a cover for this notebook.
          </DialogDescription>
        </DialogHeader>

        <CoverPicker value={selected} onChange={setSelected} />

        <div className="mt-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={save}
            disabled={!dirty || updateCover.isPending}
          >
            {updateCover.isPending ? "Saving…" : "Save cover"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
