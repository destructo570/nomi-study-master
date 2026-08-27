import {
  CodeIcon,
  FlashIcon,
  FunctionOfXIcon,
  HeadingIcon,
  HeadphonesIcon,
  HelpCircleIcon,
  LeftToRightListBulletIcon,
  IdeaIcon,
  MagicWand01Icon,
  MathIcon,
  TextIcon,
} from "@hugeicons/core-free-icons"

import { sampleFlashcards, sampleQuiz } from "@/lib/mock-samples"

import type { SlashItem } from "./slash-menu"

export const slashItems: SlashItem[] = [
  {
    title: "Text",
    description: "Plain paragraph",
    icon: TextIcon,
    keywords: ["paragraph", "p"],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: HeadingIcon,
    keywords: ["h1", "title"],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run(),
  },
  {
    title: "Heading 2",
    description: "Medium heading",
    icon: HeadingIcon,
    keywords: ["h2"],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run(),
  },
  {
    title: "Bulleted list",
    description: "Unordered list",
    icon: LeftToRightListBulletIcon,
    keywords: ["list", "ul"],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: "Code block",
    description: "Monospaced code",
    icon: CodeIcon,
    keywords: ["code", "pre"],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: "Inline math",
    description: "LaTeX formula inline",
    icon: FunctionOfXIcon,
    keywords: ["math", "latex", "inline", "formula", "katex"],
    run: (editor, range) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertInlineMath({ latex: "E = mc^2" })
        .run(),
  },
  {
    title: "Block math",
    description: "Centered LaTeX formula",
    icon: MathIcon,
    keywords: ["math", "latex", "block", "formula", "katex", "equation"],
    run: (editor, range) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertBlockMath({ latex: "\\sum_{i=1}^{n} x_i" })
        .run(),
  },
  {
    title: "Callout",
    description: "Highlighted note",
    icon: IdeaIcon,
    keywords: ["note", "info", "tip", "callout"],
    run: (editor, range) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: "callout",
          attrs: { variant: "info" },
          content: [{ type: "paragraph" }],
        })
        .run(),
  },
  {
    title: "Flashcards",
    description: "Generate flashcards",
    icon: FlashIcon,
    keywords: ["cards", "study"],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).insertFlashcard(sampleFlashcards()).run(),
  },
  {
    title: "Quiz",
    description: "Generate MCQ quiz",
    icon: HelpCircleIcon,
    keywords: ["mcq", "test"],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).insertQuiz(sampleQuiz()).run(),
  },
  {
    title: "Audio",
    description: "Podcast-style audio",
    icon: HeadphonesIcon,
    keywords: ["podcast", "voice"],
    run: (editor, range) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertAudio({
          title: "Generated audio",
          script: "A short audio walkthrough of this notebook.",
          segments: [
            "Welcome to this quick audio summary.",
            "Here are the key ideas covered in your notes.",
          ],
        })
        .run(),
  },
  {
    title: "AI block",
    description: "Editable AI-generated note",
    icon: MagicWand01Icon,
    keywords: ["ai", "generated"],
    run: (editor, range) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertAiBlock("Ask the AI panel to fill this in.", "AI generated")
        .run(),
  },
]
