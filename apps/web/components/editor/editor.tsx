"use client"

import { useEffect, useImperativeHandle, useRef } from "react"
import type { Ref } from "react"
import { EditorContent, useEditor, type Content, type Editor } from "@tiptap/react"

import { cn } from "@workspace/ui/lib/utils"

import type { NotebookDoc } from "@workspace/types"

import { buildExtensions } from "./extensions"

export type EditorHandle = {
  editor: Editor | null
}

type NotebookEditorProps = {
  initialDoc: NotebookDoc
  onChange?: (doc: NotebookDoc) => void
  editable?: boolean
  placeholder?: string
  className?: string
  editorRef?: Ref<EditorHandle>
}

export function NotebookEditor({
  initialDoc,
  onChange,
  editable = true,
  placeholder,
  className,
  editorRef,
}: NotebookEditorProps) {
  const latestDocRef = useRef(initialDoc)
  latestDocRef.current = initialDoc

  const mathEditorRef = useRef<Editor | null>(null)

  const editor = useEditor({
    extensions: buildExtensions(placeholder, () => mathEditorRef.current),
    content: initialDoc as unknown as Content,
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

  useImperativeHandle(editorRef, () => ({ editor: editor ?? null }), [editor])

  useEffect(() => {
    if (!editor) return
    editor.setEditable(editable)
  }, [editor, editable])

  return <EditorContent editor={editor} />
}
