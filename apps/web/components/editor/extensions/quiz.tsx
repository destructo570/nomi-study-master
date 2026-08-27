"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react"

import { QuizBlock } from "@/components/blocks/quiz-block"
import type { QuizQuestion } from "@workspace/types"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    quiz: {
      insertQuiz: (questions: QuizQuestion[]) => ReturnType
    }
  }
}

export const QuizExtension = Node.create({
  name: "quiz",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      questions: {
        default: [] as QuizQuestion[],
        parseHTML: (el) => {
          const raw = el.getAttribute("data-questions")
          if (!raw) return []
          try {
            return JSON.parse(raw) as QuizQuestion[]
          } catch {
            return []
          }
        },
        renderHTML: (attrs) => ({ "data-questions": JSON.stringify(attrs.questions) }),
      },
    }
  },

  parseHTML() {
    return [{ tag: "div[data-quiz]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-quiz": "" }, HTMLAttributes)]
  },

  addCommands() {
    return {
      insertQuiz:
        (questions) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { questions } }),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuizNodeView)
  },
})

function QuizNodeView({ node }: ReactNodeViewProps) {
  const questions = (node.attrs.questions as QuizQuestion[]) ?? []
  return (
    <NodeViewWrapper className="my-3">
      <QuizBlock questions={questions} />
    </NodeViewWrapper>
  )
}
