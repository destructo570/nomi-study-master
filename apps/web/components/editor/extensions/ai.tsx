"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react"

import { AiBlock } from "@/components/blocks/ai-block"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    aiBlock: {
      insertAiBlock: (markdown: string, label?: string) => ReturnType
    }
  }
}

export const AiBlockExtension = Node.create({
  name: "aiBlock",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      label: {
        default: "AI generated" as string,
        parseHTML: (el) => el.getAttribute("data-label") ?? "AI generated",
        renderHTML: (attrs) => ({ "data-label": attrs.label }),
      },
    }
  },

  parseHTML() {
    return [{ tag: "div[data-ai-block]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-ai-block": "" }, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      insertAiBlock:
        (markdown, label) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { label: label ?? "AI generated" },
            content: [
              { type: "paragraph", content: [{ type: "text", text: markdown }] },
            ],
          }),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(AiNodeView)
  },
})

function AiNodeView({ node }: ReactNodeViewProps) {
  const label = (node.attrs.label as string | undefined) ?? "AI generated"
  return (
    <NodeViewWrapper className="my-3">
      <AiBlock label={label}>
        <NodeViewContent className="focus:outline-none" />
      </AiBlock>
    </NodeViewWrapper>
  )
}
