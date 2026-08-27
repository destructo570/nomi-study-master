import { Mathematics } from "@tiptap/extension-mathematics"
import type { Editor } from "@tiptap/react"

import { openMathEdit } from "../math-edit-store"

const KATEX_OPTIONS = {
  throwOnError: false,
  macros: {
    "\\R": "\\mathbb{R}",
    "\\N": "\\mathbb{N}",
    "\\Z": "\\mathbb{Z}",
  },
} as const

/**
 * Build a Mathematics extension bound to a specific editor instance.
 *
 * Tiptap's `onClick` option fires on user clicks but does not receive the
 * editor, so we close over a `getEditor` getter (sourced from a per-component
 * ref) and push an edit request to the shared {@link openMathEdit} store. A
 * single mounted {@link MathEditDialog} then opens a modal to edit the LaTeX.
 *
 * Read-only editors (`editor.isEditable === false`) are skipped so the dialog
 * only opens when editing is actually possible.
 */
export function createMathematicsExtension(getEditor: () => Editor | null) {
  return Mathematics.configure({
    katexOptions: KATEX_OPTIONS,
    inlineOptions: {
      onClick: (node, pos) => {
        const editor = getEditor()
        if (!editor?.isEditable) return
        openMathEdit({
          editor,
          pos,
          latex: (node.attrs.latex as string | undefined) ?? "",
          mode: "inline",
        })
      },
    },
    blockOptions: {
      onClick: (node, pos) => {
        const editor = getEditor()
        if (!editor?.isEditable) return
        openMathEdit({
          editor,
          pos,
          latex: (node.attrs.latex as string | undefined) ?? "",
          mode: "block",
        })
      },
    },
  })
}