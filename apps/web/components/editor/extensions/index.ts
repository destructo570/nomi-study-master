import type { Editor } from "@tiptap/react"
import Placeholder from "@tiptap/extension-placeholder"
import StarterKit from "@tiptap/starter-kit"

import { AiBlockExtension } from "./ai"
import { AudioExtension } from "./audio"
import { CalloutExtension } from "./callout"
import { CodeBlockExtension } from "./code-block"
import { FlashcardExtension } from "./flashcard"
import { createMathematicsExtension } from "./math"
import { QuizExtension } from "./quiz"
import { SlashCommandExtension } from "./slash-command"

export function buildExtensions(
  placeholder = "Type / for commands",
  getEditor: () => Editor | null = () => null,
) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      codeBlock: false,
    }),
    CodeBlockExtension,
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === "heading") return "Heading"
        return placeholder
      },
    }),
    createMathematicsExtension(getEditor),
    CalloutExtension,
    FlashcardExtension,
    QuizExtension,
    AudioExtension,
    AiBlockExtension,
    SlashCommandExtension,
  ]
}
