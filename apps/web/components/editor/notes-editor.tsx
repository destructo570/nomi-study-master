"use client"

import { useEffect, useMemo, useRef } from "react"
import Placeholder from "@tiptap/extension-placeholder"
import { EditorContent, useEditor, type Content, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

import { cn } from "@workspace/ui/lib/utils"

import type { NotebookDoc } from "@workspace/types"

import { CalloutExtension } from "./extensions/callout"
import { CodeBlockExtension } from "./extensions/code-block"
import { createMathematicsExtension } from "./extensions/math"
import { SlashCommandExtension } from "./extensions/slash-command"
import { slashItems } from "./slash-items"

const EXCLUDED_SLASH_TITLES = new Set(["Flashcards", "Quiz", "Audio", "AI block"])

type NotesEditorProps = {
  initialDoc: NotebookDoc | null
  onChange?: (doc: NotebookDoc) => void
  editable?: boolean
  placeholder?: string
  className?: string
}

const EMPTY_DOC: NotebookDoc = { type: "doc", content: [] }

export function NotesEditor({
  initialDoc,
  onChange,
  editable = true,
  placeholder = "Type / for commands",
  className,
}: NotesEditorProps) {
  const mathEditorRef = useRef<Editor | null>(null)

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      CodeBlockExtension,
      createMathematicsExtension(() => mathEditorRef.current),
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === "heading" ? "Heading" : placeholder,
      }),
      CalloutExtension,
      SlashCommandExtension.configure({
        items: slashItems.filter((i) => !EXCLUDED_SLASH_TITLES.has(i.title)),
      }),
    ],
    [placeholder],
  )

  const editor = useEditor({
    extensions,
    content: (initialDoc ?? EMPTY_DOC) as unknown as Content,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn("notebook-editor focus:outline-none", className),
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getJSON() as unknown as NotebookDoc)
    },
  })

  useEffect(() => {
    mathEditorRef.current = editor
  }, [editor])

  useEffect(() => {
    if (!editor) return
    editor.setEditable(editable)
  }, [editor, editable])

  return <EditorContent editor={editor} />
}
