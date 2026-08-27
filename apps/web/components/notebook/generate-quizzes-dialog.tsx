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

import { useGenerateQuizzes } from "@/lib/hooks/use-generate"
import { useDefaultLanguage } from "@/lib/hooks/use-me"
import { useNotebook } from "@/lib/hooks/use-workspace"
import { LanguageCombobox } from "@/components/language-combobox"
import { normalizeLanguage, type LanguageCode } from "@workspace/types/language"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  notebookId: string
}

const QUIZ_DEFAULT_COUNT = 15 as const

export function GenerateQuizzesDialog({
  open,
  onOpenChange,
  notebookId,
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

  const generate = useGenerateQuizzes(notebookId)

  async function submit() {
    try {
      await generate.mutateAsync({ count: QUIZ_DEFAULT_COUNT, language })
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate quizzes"
      toast.error(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate quizzes</DialogTitle>
          <DialogDescription>
            We&apos;ll create up to {QUIZ_DEFAULT_COUNT} questions from your sources.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 grid gap-2">
          <Label htmlFor="qz-language">Language</Label>
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

