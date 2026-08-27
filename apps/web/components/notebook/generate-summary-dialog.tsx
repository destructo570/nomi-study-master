"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { MagicWand01Icon, SparklesIcon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Label } from "@workspace/ui/components/label"

import { useGenerateSummary } from "@/lib/hooks/use-generate"
import { useDefaultLanguage } from "@/lib/hooks/use-me"
import { useNotebook } from "@/lib/hooks/use-workspace"
import { LanguageCombobox } from "@/components/language-combobox"
import type { Summary } from "@workspace/types"
import { normalizeLanguage, type LanguageCode } from "@workspace/types/language"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  notebookId: string
  onGenerated?: (summary: Summary) => void
}

export function GenerateSummaryDialog({
  open,
  onOpenChange,
  notebookId,
  onGenerated,
}: Props) {
  const userLanguage = useDefaultLanguage()
  const notebook = useNotebook(notebookId)
  const notebookLanguage = notebook.data?.language
    ? normalizeLanguage(notebook.data.language)
    : null
  const defaultLanguage = notebookLanguage ?? userLanguage
  const [language, setLanguage] = useState<LanguageCode>(defaultLanguage)

  useEffect(() => {
    if (open) setLanguage(defaultLanguage)
  }, [open, defaultLanguage])

  const generate = useGenerateSummary(notebookId)

  async function submit() {
    try {
      const row = await generate.mutateAsync({
        depth: "detailed",
        language,
      })
      onGenerated?.(row)
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate summary"
      toast.error(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate summary</DialogTitle>
          <DialogDescription>
            We&apos;ll create a detailed summary from your notebook&apos;s sources.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 grid gap-2">
          <Label htmlFor="sum-language">Language</Label>
          <LanguageCombobox
            value={language}
            onChange={setLanguage}
            disabled={generate.isPending}
            className="w-full"
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={generate.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={generate.isPending}
          >
            <HugeiconsIcon
              icon={generate.isPending ? SparklesIcon : MagicWand01Icon}
              strokeWidth={2}
              className="size-4"
            />
            {generate.isPending ? "Generating…" : "Generate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

