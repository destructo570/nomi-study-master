"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react"

import { FlashcardBlock } from "@/components/blocks/flashcard-block"
import type { FlashcardCard } from "@workspace/types"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    flashcard: {
      insertFlashcard: (cards: FlashcardCard[]) => ReturnType
    }
  }
}

export const FlashcardExtension = Node.create({
  name: "flashcard",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      cards: {
        default: [] as FlashcardCard[],
        parseHTML: (el) => {
          const raw = el.getAttribute("data-cards")
          if (!raw) return []
          try {
            return JSON.parse(raw) as FlashcardCard[]
          } catch {
            return []
          }
        },
        renderHTML: (attrs) => ({ "data-cards": JSON.stringify(attrs.cards) }),
      },
    }
  },

  parseHTML() {
    return [{ tag: "div[data-flashcard]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-flashcard": "" }, HTMLAttributes)]
  },

  addCommands() {
    return {
      insertFlashcard:
        (cards) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { cards } }),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(FlashcardNodeView)
  },
})

function FlashcardNodeView({ node }: ReactNodeViewProps) {
  const cards = (node.attrs.cards as FlashcardCard[]) ?? []
  return (
    <NodeViewWrapper className="my-3">
      <FlashcardBlock cards={cards} />
    </NodeViewWrapper>
  )
}
