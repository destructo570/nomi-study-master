"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { api } from "@/lib/api"
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

type FeedbackDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [value, setValue] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) setValue("")
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const message = value.trim()
    if (!message) return
    setSubmitting(true)
    try {
      await api.submitFeedback(message)
      toast.success("Thanks for the feedback!")
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send feedback")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Send feedback</DialogTitle>
            <DialogDescription>
              Spot a bug or have an idea? Tell us anything.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-32 sm:min-h-40"
          />
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !value.trim()}
              className="w-full sm:w-auto"
            >
              {submitting ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
