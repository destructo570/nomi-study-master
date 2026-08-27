"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react"

import { CalloutBlock, type CalloutVariant } from "@/components/blocks/callout-block"

export type CalloutAttrs = {
  variant: CalloutVariant
}

export const CalloutExtension = Node.create({
  name: "callout",
  group: "block",
  content: "inline*",
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: "info" as CalloutVariant,
        parseHTML: (el) => (el.getAttribute("data-variant") as CalloutVariant) ?? "info",
        renderHTML: (attrs) => ({ "data-variant": attrs.variant }),
      },
    }
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-callout": "" }, HTMLAttributes), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutNodeView)
  },
})

function CalloutNodeView({ node }: ReactNodeViewProps) {
  const variant = (node.attrs as CalloutAttrs).variant
  return (
    <NodeViewWrapper>
      <CalloutBlock variant={variant}>
        <NodeViewContent className="focus:outline-none" />
      </CalloutBlock>
    </NodeViewWrapper>
  )
}
