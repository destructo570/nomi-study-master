"use client"

import { useEffect, useState } from "react"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"

import { useDefaultLanguage } from "@/lib/hooks/use-me"
import { LanguageCombobox } from "@/components/language-combobox"
import type { LanguageCode } from "@workspace/types/language"

type LinkModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  submitting?: boolean
  onSubmit: (input: { url: string; language: LanguageCode }) => void | Promise<void>
}

export function LinkModal({
  open,
  onOpenChange,
  submitting,
  onSubmit,
}: LinkModalProps) {
  const defaultLanguage = useDefaultLanguage()
  const [url, setUrl] = useState("")
  const [language, setLanguage] = useState<LanguageCode>(defaultLanguage)

  useEffect(() => {
    if (open) {
      setLanguage(defaultLanguage)
    } else {
      setUrl("")
    }
  }, [open, defaultLanguage])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return
    await onSubmit({ url: trimmed, language })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Add a link</DialogTitle>
            <DialogDescription>
              Paste a YouTube or web link. We&apos;ll create a notebook and pull
              the content for you.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="link-url">Link</Label>
            <Input
              id="link-url"
              autoFocus
              type="url"
              value={url}
              placeholder="https://youtube.com/watch?v=…"
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="link-language">Language</Label>
            <LanguageCombobox
              value={language}
              onChange={setLanguage}
              disabled={submitting}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              AI generations in this notebook will default to this language.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!url.trim() || submitting}>
              {submitting ? "Creating…" : "Create notebook"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type TextModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  submitting?: boolean
  onSubmit: (input: {
    title: string
    content: string
    language: LanguageCode
  }) => void | Promise<void>
}

export function TextModal({
  open,
  onOpenChange,
  submitting,
  onSubmit,
}: TextModalProps) {
  const defaultLanguage = useDefaultLanguage()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [language, setLanguage] = useState<LanguageCode>(defaultLanguage)

  useEffect(() => {
    if (open) {
      setLanguage(defaultLanguage)
    } else {
      setTitle("")
      setContent("")
    }
  }, [open, defaultLanguage])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedTitle = title.trim() || "Pasted text"
    const trimmedContent = content.trim()
    if (!trimmedContent) return
    await onSubmit({ title: trimmedTitle, content: trimmedContent, language })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Paste text</DialogTitle>
            <DialogDescription>
              Drop in any notes, transcript, or article. We&apos;ll turn it into
              a notebook you can chat with.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="text-title">Title</Label>
            <Input
              id="text-title"
              value={title}
              placeholder="Optional - defaults to “Pasted text”"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="text-content">Content</Label>
            <Textarea
              id="text-content"
              autoFocus
              rows={10}
              value={content}
              placeholder="Paste anything here…"
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="text-language">Language</Label>
            <LanguageCombobox
              value={language}
              onChange={setLanguage}
              disabled={submitting}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              AI generations in this notebook will default to this language.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!content.trim() || submitting}>
              {submitting ? "Creating…" : "Create notebook"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
