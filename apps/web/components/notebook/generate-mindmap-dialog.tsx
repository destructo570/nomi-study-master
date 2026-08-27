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
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group"
import { Textarea } from "@workspace/ui/components/textarea"

import { useGenerateMindmap } from "@/lib/hooks/use-generate"
import { useDefaultLanguage } from "@/lib/hooks/use-me"
import { useNotebook } from "@/lib/hooks/use-workspace"
import { LanguageCombobox } from "@/components/language-combobox"
import type { Mindmap, MindmapDepth } from "@workspace/types"
import { normalizeLanguage, type LanguageCode } from "@workspace/types/language"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  notebookId: string
  onGenerated?: (mindmap: Mindmap) => void
}

export function GenerateMindmapDialog({
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
  const [title, setTitle] = useState("")
  const [prompt, setPrompt] = useState("")
  const [depth, setDepth] = useState<MindmapDepth>("normal")
  const [language, setLanguage] = useState<LanguageCode>(defaultLanguage)
  const generate = useGenerateMindmap(notebookId)

  useEffect(() => {
    if (open) {
      setTitle("")
      setPrompt("")
      setDepth("normal")
      setLanguage(defaultLanguage)
    }
  }, [open, defaultLanguage])

  async function submit() {
    try {
      const row = await generate.mutateAsync({
        title: title.trim() || undefined,
        prompt: prompt.trim() || undefined,
        depth,
        language,
      })
      onGenerated?.(row)
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate mindmap"
      toast.error(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate mindmap</DialogTitle>
          <DialogDescription>
            A new mindmap is built from the notebook&apos;s text sources.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="mm-title">Title (optional)</Label>
            <Input
              id="mm-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Defaults to today's date"
              maxLength={120}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mm-prompt">Extra context (optional)</Label>
            <Textarea
              id="mm-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. focus on the causes and consequences, skip the historical background"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="grid gap-2">
            <Label>Depth</Label>
            <RadioGroup
              value={depth}
              onValueChange={(v) => setDepth(v as MindmapDepth)}
              className="grid grid-cols-3 gap-2"
            >
              <DepthRadio id="mm-shallow" value="shallow" label="Shallow" />
              <DepthRadio id="mm-normal" value="normal" label="Normal" />
              <DepthRadio id="mm-deep" value="deep" label="Deep" />
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mm-language">Language</Label>
            <LanguageCombobox
              value={language}
              onChange={setLanguage}
              disabled={generate.isPending}
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2">
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

function DepthRadio({
  id,
  value,
  label,
}: {
  id: string
  value: string
  label: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2">
      <RadioGroupItem value={value} id={id} />
      <Label htmlFor={id} className="text-xs font-medium">
        {label}
      </Label>
    </div>
  )
}
