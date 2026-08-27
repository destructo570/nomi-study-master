import type { Editor } from "@tiptap/react"

export type MathEditMode = "inline" | "block"

export type MathEditRequest = {
  editor: Editor
  pos: number
  latex: string
  mode: MathEditMode
}

type State = MathEditRequest | null

let state: State = null
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function subscribeMathEdit(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getMathEditSnapshot(): State {
  return state
}

export function openMathEdit(request: MathEditRequest) {
  state = request
  emit()
}

export function closeMathEdit() {
  state = null
  emit()
}