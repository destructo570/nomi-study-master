"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react"

import { AudioBlock } from "@/components/blocks/audio-block"

type AudioAttrs = {
  title?: string
  script: string
  segments?: string[]
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    audio: {
      insertAudio: (attrs: AudioAttrs) => ReturnType
    }
  }
}

export const AudioExtension = Node.create({
  name: "audio",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      title: { default: undefined as string | undefined },
      script: { default: "" as string },
      segments: { default: undefined as string[] | undefined },
    }
  },

  parseHTML() {
    return [{ tag: "div[data-audio]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-audio": "" }, HTMLAttributes)]
  },

  addCommands() {
    return {
      insertAudio:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(AudioNodeView)
  },
})

function AudioNodeView({ node }: ReactNodeViewProps) {
  const { title, script, segments } = node.attrs as AudioAttrs
  return (
    <NodeViewWrapper className="my-3">
      <AudioBlock title={title} script={script} segments={segments} />
    </NodeViewWrapper>
  )
}
