import { and, asc, eq, isNull } from "drizzle-orm"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { nanoid } from "nanoid"
import { z } from "zod"
import dagre from "@dagrejs/dagre"

import { db } from "@workspace/db"
import { sources } from "@workspace/db/schema"
import type {
  FlashcardCard,
  FlowEdge,
  FlowNode,
  MindmapData,
  MindmapDepth,
  QuizQuestion,
  SummaryDepth,
  TutorPreset,
} from "@workspace/types"
import { getLanguage } from "@workspace/types/language"

function languageName(code: string | null | undefined): string {
  return getLanguage(code).name
}

import { discordLogger } from "../logger/discord"

import { TUTOR_PRESETS } from "./presets"
import { loadPrompt } from "./prompts"

const MAX_CONTEXT_CHARS = 12_000

const MODEL_ID = "gpt-4o-mini"

// Output-token caps. Sized to fit the largest legitimate output for each
// shape (e.g. 15 quiz questions ≈ 2k tokens) plus headroom; defends against
// runaway output if a prompt elicits unbounded text.
const MAX_TOKENS_TITLE = 100
const MAX_TOKENS_SUMMARY = 2500
const MAX_TOKENS_FLASHCARDS = 2000
const MAX_TOKENS_QUIZZES = 2500
const MAX_TOKENS_MINDMAP = 2000

// Translation caps run higher than the corresponding generation caps:
// non-Latin scripts (CJK, Devanagari, Arabic, Thai) take roughly 1.5–2.5×
// the tokens per character of English, so an English source that fits in
// 2500 output tokens can easily need 5–8k for a Korean or Japanese
// translation. Hitting the cap mid-output truncates the JSON string and
// blows up the AI-SDK parser — preferred failure mode is "no translation"
// over "half a translation", so we give the model real headroom.
const MAX_TOKENS_TRANSLATE_TEXT = 12_000
const MAX_TOKENS_TRANSLATE_FLASHCARDS = 6_000
const MAX_TOKENS_TRANSLATE_QUIZZES = 8_000
const MAX_TOKENS_TRANSLATE_MINDMAP = 4_000

function hasApiKey(): boolean {
  return !!process.env.OPENAI_API_KEY
}

function clamp(text: string, limit = MAX_CONTEXT_CHARS): string {
  return text.length > limit ? text.slice(0, limit) : text
}

function presetSystem(preset: TutorPreset | null | undefined): string {
  if (!preset) return ""
  return TUTOR_PRESETS[preset].systemPrompt
}

export async function aggregateSourceContent(notebookId: string): Promise<{
  text: string
  count: number
}> {
  const rows = await db
    .select()
    .from(sources)
    .where(and(eq(sources.notebookId, notebookId), isNull(sources.archivedAt)))
    .orderBy(asc(sources.createdAt))
  const parts: string[] = []
  for (const r of rows) {
    if (r.type === "file" && r.status !== "ready") continue
    if (!r.content || r.content.trim().length === 0) continue
    parts.push(`# ${r.title}\n\n${r.content}`)
  }
  const text = parts.join("\n\n---\n\n")
  return { text: clamp(text), count: parts.length }
}

function fallbackTitle(userMessage: string): string {
  const clean = userMessage.replace(/\s+/g, " ").trim()
  if (!clean) return "New chat"
  return clean.length > 40 ? clean.slice(0, 40).trimEnd() + "…" : clean
}

const chatTitleSchema = z.object({ title: z.string().min(1).max(60) })

export async function generateChatTitle(args: {
  userMessage: string
  assistantMessage: string
}): Promise<string> {
  if (!hasApiKey()) return fallbackTitle(args.userMessage)
  try {
    const { object } = await generateObject({
      model: openai(MODEL_ID),
      schema: chatTitleSchema,
      system: loadPrompt("chat-title"),
      prompt: `User: ${clamp(args.userMessage, 500)}\n\nAssistant: ${clamp(args.assistantMessage, 1000)}`,
      maxOutputTokens: MAX_TOKENS_TITLE,
    })
    return object.title.trim()
  } catch (err) {
    console.error("[ai/generate] chat title falling back:", err)
    discordLogger().openaiError({ operation: "generate.chatTitle", error: err, context: { model: MODEL_ID } })
    return fallbackTitle(args.userMessage)
  }
}

const summarySchema = z.object({ markdown: z.string().min(20) })

export type SummaryArgs = {
  content: string
  title: string
  depth: SummaryDepth
  prompt?: string | null
  tutorPreset?: TutorPreset | null
  /** ISO 639-1 code; AI output is produced in this language. Defaults to English. */
  language?: string | null
}

function mockSummary({ title, depth, prompt }: SummaryArgs): string {
  const lead =
    depth === "detailed"
      ? "A deeper dive covering background, mechanisms, and implications."
      : "A concise overview you can skim in under a minute."
  const extra = prompt?.trim() ? `\n\n> Custom angle: ${prompt.trim()}` : ""
  return `# ${title}\n\n_${lead}_${extra}\n\n## Key points\n\n- Core idea one\n- Core idea two\n- Core idea three\n\n## Why it matters\n\nThis section is a mock summary rendered because \`OPENAI_API_KEY\` is not set. Wire up the key to generate real output.`
}

export async function generateSummary(args: SummaryArgs): Promise<{ markdown: string }> {
  if (!hasApiKey() || !args.content.trim()) {
    return { markdown: mockSummary(args) }
  }
  const language = languageName(args.language)
  const summaryPrompt =
    args.depth === "detailed"
      ? loadPrompt("summary-detailed", { language })
      : loadPrompt("summary-concise", { language })
  const system = [summaryPrompt, presetSystem(args.tutorPreset ?? null)]
    .filter(Boolean)
    .join("\n\n")
  const userPrompt = [
    `OUTPUT LANGUAGE: ${language}. Write every word of the summary in ${language}. The source below may be in another language — translate it.`,
    "",
    `Title: ${args.title}`,
    args.prompt?.trim() ? `Custom angle from the user: ${args.prompt.trim()}` : undefined,
    "",
    "Source content:",
    clamp(args.content),
  ]
    .filter(Boolean)
    .join("\n")
  try {
    const { object } = await generateObject({
      model: openai(MODEL_ID),
      schema: summarySchema,
      system,
      prompt: userPrompt,
      maxOutputTokens: MAX_TOKENS_SUMMARY,
    })
    return object
  } catch (err) {
    console.error("[ai/generate] summary falling back to mock:", err)
    discordLogger().openaiError({ operation: "generate.summary", error: err, context: { model: MODEL_ID } })
    return { markdown: mockSummary(args) }
  }
}

const flashcardsSchema = z.object({
  cards: z
    .array(
      z.object({
        question: z.string().min(3),
        answer: z.string().min(1),
        hint: z.string().nullable(),
      }),
    )
    .min(1),
})

export type FlashcardsArgs = {
  content: string
  title: string
  count: number
  prompt?: string | null
  existingQuestions?: string[]
  tutorPreset?: TutorPreset | null
  language?: string | null
}

function mockFlashcards({ title, count }: FlashcardsArgs): FlashcardCard[] {
  return Array.from({ length: count }, (_, i) => ({
    question: `[mock] ${title} — question ${i + 1}?`,
    answer: `[mock] Answer ${i + 1} about ${title}. (Set OPENAI_API_KEY to get real flashcards.)`,
    hint: `[mock] hint ${i + 1}`,
  }))
}

export async function generateFlashcards(
  args: FlashcardsArgs,
): Promise<{ cards: FlashcardCard[] }> {
  if (!hasApiKey() || !args.content.trim()) {
    return { cards: mockFlashcards(args) }
  }
  const language = languageName(args.language)
  const system = [
    loadPrompt("flashcards", { count: args.count, language }),
    presetSystem(args.tutorPreset ?? null),
  ]
    .filter(Boolean)
    .join("\n\n")
  const userPrompt = [
    `OUTPUT LANGUAGE: ${language}. Every question, answer, and hint must be in ${language}. The source below may be in another language — translate it.`,
    "",
    `Title: ${args.title}`,
    args.prompt?.trim() ? `Focus/angle from the user: ${args.prompt.trim()}` : undefined,
    args.existingQuestions && args.existingQuestions.length > 0
      ? `Existing questions (avoid duplicates):\n- ${args.existingQuestions.slice(0, 40).join("\n- ")}`
      : undefined,
    "",
    "Source content:",
    clamp(args.content),
  ]
    .filter(Boolean)
    .join("\n")
  try {
    const { object } = await generateObject({
      model: openai(MODEL_ID),
      schema: flashcardsSchema,
      system,
      prompt: userPrompt,
      maxOutputTokens: MAX_TOKENS_FLASHCARDS,
    })
    return { cards: object.cards.slice(0, args.count) }
  } catch (err) {
    console.error("[ai/generate] flashcards falling back to mock:", err)
    discordLogger().openaiError({ operation: "generate.flashcards", error: err, context: { model: MODEL_ID } })
    return { cards: mockFlashcards(args) }
  }
}

const quizzesSchema = z.object({
  questions: z
    .array(
      z
        .object({
          question: z.string().min(3),
          options: z.array(z.string().min(1)).length(4),
          correctAnswer: z.string().min(1),
        })
        .refine((q) => q.options.includes(q.correctAnswer), {
          message: "correctAnswer must appear in options",
        }),
    )
    .min(1),
})

export type QuizzesArgs = {
  content: string
  title: string
  count: number
  prompt?: string | null
  existingQuestions?: string[]
  tutorPreset?: TutorPreset | null
  language?: string | null
}

function mockQuizzes({ title, count }: QuizzesArgs): QuizQuestion[] {
  return Array.from({ length: count }, (_, i) => ({
    question: `[mock] ${title} — quiz question ${i + 1}?`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctAnswer: "Option A",
  }))
}

type MindmapTreeNode = {
  label: string
  children: MindmapTreeNode[] | null
}

const mindmapTreeNodeSchema: z.ZodType<MindmapTreeNode> = z.lazy(() =>
  z.object({
    label: z.string().min(1).max(80),
    // OpenAI strict structured outputs require every property to be `required`.
    // Use nullable (not optional) so leaves can send `null`.
    children: z.array(mindmapTreeNodeSchema).max(7).nullable(),
  }),
)

const mindmapSchema = z.object({
  root: mindmapTreeNodeSchema,
})

const DEPTH_CAPS: Record<
  MindmapDepth,
  { maxDepth: number; maxNodes: number; label: string }
> = {
  shallow: { maxDepth: 3, maxNodes: 20, label: "shallow (3 levels, ~20 nodes)" },
  normal: { maxDepth: 4, maxNodes: 40, label: "normal (4 levels, ~40 nodes)" },
  deep: { maxDepth: 5, maxNodes: 60, label: "deep (5 levels, ~60 nodes)" },
}

const NODE_WIDTH = 180
const NODE_HEIGHT = 48

export type MindmapArgs = {
  content: string
  title: string
  depth: MindmapDepth
  prompt?: string | null
  tutorPreset?: TutorPreset | null
  language?: string | null
}

function treeToFlow(
  root: MindmapTreeNode,
  maxNodes: number,
  maxDepth: number,
): MindmapData {
  const nodes: FlowNode[] = []
  const edges: FlowEdge[] = []
  const walk = (node: MindmapTreeNode, depth: number, parentId: string | null) => {
    if (nodes.length >= maxNodes) return
    if (depth > maxDepth) return
    const id = nanoid(8)
    nodes.push({
      id,
      position: { x: 0, y: 0 },
      data: { label: node.label },
      type: "mindmap",
    })
    if (parentId) {
      edges.push({
        id: `${parentId}-${id}`,
        source: parentId,
        target: id,
        type: "default",
      })
    }
    for (const child of node.children ?? []) {
      walk(child, depth + 1, id)
    }
  }
  walk(root, 0, null)
  return layoutFlow({ nodes, edges })
}

export function layoutFlow(data: MindmapData): MindmapData {
  if (data.nodes.length === 0) return data
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: "LR", nodesep: 40, ranksep: 90 })
  g.setDefaultEdgeLabel(() => ({}))
  for (const node of data.nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }
  for (const edge of data.edges) {
    g.setEdge(edge.source, edge.target)
  }
  dagre.layout(g)
  const nodes = data.nodes.map((node) => {
    const pos = g.node(node.id)
    return {
      ...node,
      position: pos
        ? { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 }
        : node.position,
    }
  })
  return { nodes, edges: data.edges }
}

function mockMindmap({ title }: MindmapArgs): MindmapData {
  const tree: MindmapTreeNode = {
    label: title || "Central idea",
    children: [
      {
        label: "Branch 1",
        children: [
          { label: "Detail A", children: null },
          { label: "Detail B", children: null },
        ],
      },
      {
        label: "Branch 2",
        children: [{ label: "Detail C", children: null }],
      },
      { label: "[mock] Set OPENAI_API_KEY for real output", children: null },
    ],
  }
  return treeToFlow(tree, 20, 5)
}

export async function generateMindmap(args: MindmapArgs): Promise<MindmapData> {
  if (!hasApiKey() || !args.content.trim()) {
    return mockMindmap(args)
  }
  const cap = DEPTH_CAPS[args.depth]
  const language = languageName(args.language)
  const system = [
    loadPrompt("mindmap", { depthLabel: cap.label, language }),
    presetSystem(args.tutorPreset ?? null),
  ]
    .filter(Boolean)
    .join("\n\n")
  const userPrompt = [
    `OUTPUT LANGUAGE: ${language}. Every label in every node (root and children) must be in ${language}. The source below may be in another language — translate it.`,
    "",
    `Title: ${args.title}`,
    args.prompt?.trim() ? `Focus/angle from the user: ${args.prompt.trim()}` : undefined,
    "",
    "Source content:",
    clamp(args.content),
  ]
    .filter(Boolean)
    .join("\n")
  try {
    const { object } = await generateObject({
      model: openai(MODEL_ID),
      schema: mindmapSchema,
      system,
      prompt: userPrompt,
      maxOutputTokens: MAX_TOKENS_MINDMAP,
    })
    return treeToFlow(object.root, cap.maxNodes, cap.maxDepth)
  } catch (err) {
    console.error("[ai/generate] mindmap falling back to mock:", err)
    discordLogger().openaiError({ operation: "generate.mindmap", error: err, context: { model: MODEL_ID } })
    return mockMindmap(args)
  }
}

/* ------------------------------------------------------------------ */
/* Translation                                                          */
/*                                                                      */
/* Used by /translate routes when the user adds a new language for an   */
/* artifact that already exists. We feed the model the existing payload */
/* (not the original source) so translations stay structurally parallel */
/* and cheap.                                                           */
/* ------------------------------------------------------------------ */

const translatedTextSchema = z.object({ text: z.string().min(1) })

type TranslateBaseArgs = {
  /** Code of the language the input is in (best-effort; can be wrong). */
  sourceLanguage?: string | null
  /** ISO 639-1 — required. AI output is produced in this language. */
  targetLanguage: string
}

function translationSystem(kind: string, targetLanguage: string): string {
  return [
    `You are a precise translator. The user gives you ${kind} that may be in any language.`,
    `Translate it into ${targetLanguage}. Preserve meaning, tone, formatting (Markdown, lists, code fences), and any technical terms that are conventionally left untranslated.`,
    "Do not add commentary, do not summarize, do not expand or shorten. Output only the translation.",
  ].join(" ")
}

export async function translateText(
  args: TranslateBaseArgs & { content: string },
): Promise<string> {
  if (!hasApiKey() || !args.content.trim()) {
    return `[mock ${args.targetLanguage}] ${args.content}`
  }
  const target = languageName(args.targetLanguage)
  try {
    const { object } = await generateObject({
      model: openai(MODEL_ID),
      schema: translatedTextSchema,
      system: translationSystem("a block of text", target),
      prompt: clamp(args.content),
      maxOutputTokens: MAX_TOKENS_TRANSLATE_TEXT,
    })
    return object.text
  } catch (err) {
    console.error("[ai/generate] translateText failed:", err)
    discordLogger().openaiError({
      operation: "translate.text",
      error: err,
      context: { model: MODEL_ID, target: args.targetLanguage },
    })
    // Don't silently return the untranslated original — that masks
    // failures by storing English under the target-language key. Let the
    // route handle this so the caller sees a real error.
    throw err
  }
}

export async function translateSummary(
  args: TranslateBaseArgs & { markdown: string },
): Promise<{ markdown: string }> {
  const markdown = await translateText({
    content: args.markdown,
    sourceLanguage: args.sourceLanguage,
    targetLanguage: args.targetLanguage,
  })
  return { markdown }
}

const translatedCardsSchema = z.object({
  cards: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
        hint: z.string().nullable(),
      }),
    )
    .min(1),
})

export async function translateFlashcards(
  args: TranslateBaseArgs & {
    cards: { question: string; answer: string; hint: string | null }[]
  },
): Promise<{ cards: FlashcardCard[] }> {
  if (!hasApiKey() || args.cards.length === 0) {
    return {
      cards: args.cards.map((c) => ({
        question: `[mock ${args.targetLanguage}] ${c.question}`,
        answer: `[mock ${args.targetLanguage}] ${c.answer}`,
        hint: c.hint ? `[mock ${args.targetLanguage}] ${c.hint}` : null,
      })),
    }
  }
  const target = languageName(args.targetLanguage)
  const payload = JSON.stringify({ cards: args.cards }, null, 0)
  try {
    const { object } = await generateObject({
      model: openai(MODEL_ID),
      schema: translatedCardsSchema,
      system: [
        translationSystem("a JSON array of flashcards", target),
        "Return the same number of cards in the same order. Translate every question, answer, and hint into the target language. Leave hint as null if it was null.",
      ].join(" "),
      prompt: payload,
      maxOutputTokens: MAX_TOKENS_TRANSLATE_FLASHCARDS,
    })
    return { cards: object.cards.slice(0, args.cards.length) }
  } catch (err) {
    console.error("[ai/generate] translateFlashcards failed:", err)
    discordLogger().openaiError({
      operation: "translate.flashcards",
      error: err,
      context: { model: MODEL_ID, target: args.targetLanguage },
    })
    throw err
  }
}

const translatedQuizzesSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        options: z.array(z.string().min(1)).length(4),
      }),
    )
    .min(1),
})

export async function translateQuizzes(
  args: TranslateBaseArgs & {
    quizzes: { question: string; options: string[]; correctAnswer: string }[]
  },
): Promise<{
  questions: QuizQuestion[]
}> {
  // Source-of-truth: the *index* of the correct option in each input quiz.
  // We translate question + options only, then re-map correctAnswer to the
  // translated option at the same index. This sidesteps the failure mode
  // where the model translates an option but doesn't keep correctAnswer
  // character-identical to it.
  const correctIndices = args.quizzes.map((q) =>
    Math.max(0, q.options.indexOf(q.correctAnswer)),
  )
  if (!hasApiKey() || args.quizzes.length === 0) {
    const questions = args.quizzes.map((q, i) => ({
      question: `[mock ${args.targetLanguage}] ${q.question}`,
      options: q.options.map((o) => `[mock ${args.targetLanguage}] ${o}`),
      correctAnswer: `[mock ${args.targetLanguage}] ${q.options[correctIndices[i] ?? 0]}`,
    }))
    return { questions }
  }
  const target = languageName(args.targetLanguage)
  const payload = JSON.stringify(
    {
      questions: args.quizzes.map((q) => ({
        question: q.question,
        options: q.options,
      })),
    },
    null,
    0,
  )
  try {
    const { object } = await generateObject({
      model: openai(MODEL_ID),
      schema: translatedQuizzesSchema,
      system: [
        translationSystem("a JSON array of multiple-choice quiz questions", target),
        "Return the same number of questions in the same order. Translate every question and every option into the target language. Do not reorder options.",
      ].join(" "),
      prompt: payload,
      maxOutputTokens: MAX_TOKENS_TRANSLATE_QUIZZES,
    })
    const translated = object.questions.slice(0, args.quizzes.length)
    const questions: QuizQuestion[] = translated.map((q, i) => {
      const idx = correctIndices[i] ?? 0
      const correct = q.options[idx] ?? q.options[0]!
      return { question: q.question, options: q.options, correctAnswer: correct }
    })
    return { questions }
  } catch (err) {
    console.error("[ai/generate] translateQuizzes failed:", err)
    discordLogger().openaiError({
      operation: "translate.quizzes",
      error: err,
      context: { model: MODEL_ID, target: args.targetLanguage },
    })
    throw err
  }
}

const translatedLabelsSchema = z.object({
  labels: z.array(z.string().min(1)),
})

export async function translateMindmap(
  args: TranslateBaseArgs & { data: MindmapData },
): Promise<{ data: MindmapData; title: string | null }> {
  // Translate node labels + the title in a single call. Node positions and
  // edges are preserved as-is — only the strings change.
  const nodes = args.data.nodes
  const labels = nodes.map((n) => n.data?.label ?? "")
  if (labels.length === 0) {
    return { data: args.data, title: null }
  }
  if (!hasApiKey()) {
    const next: MindmapData = {
      nodes: nodes.map((n) => ({
        ...n,
        data: { ...n.data, label: `[mock ${args.targetLanguage}] ${n.data.label}` },
      })),
      edges: args.data.edges,
    }
    return { data: next, title: null }
  }
  const target = languageName(args.targetLanguage)
  const payload = JSON.stringify({ labels }, null, 0)
  try {
    const { object } = await generateObject({
      model: openai(MODEL_ID),
      schema: translatedLabelsSchema,
      system: [
        translationSystem("a JSON array of short mindmap node labels", target),
        "Return the same number of labels in the same order. Keep labels short — typically 1–6 words each.",
      ].join(" "),
      prompt: payload,
      maxOutputTokens: MAX_TOKENS_TRANSLATE_MINDMAP,
    })
    const translated = object.labels
    const next: MindmapData = {
      nodes: nodes.map((n, i) => ({
        ...n,
        data: { ...n.data, label: translated[i] ?? n.data.label },
      })),
      edges: args.data.edges,
    }
    return { data: next, title: null }
  } catch (err) {
    console.error("[ai/generate] translateMindmap failed:", err)
    discordLogger().openaiError({
      operation: "translate.mindmap",
      error: err,
      context: { model: MODEL_ID, target: args.targetLanguage },
    })
    throw err
  }
}

export async function generateQuizzes(
  args: QuizzesArgs,
): Promise<{ questions: QuizQuestion[] }> {
  if (!hasApiKey() || !args.content.trim()) {
    return { questions: mockQuizzes(args) }
  }
  const language = languageName(args.language)
  const system = [
    loadPrompt("quizzes", { count: args.count, language }),
    presetSystem(args.tutorPreset ?? null),
  ]
    .filter(Boolean)
    .join("\n\n")
  const userPrompt = [
    `OUTPUT LANGUAGE: ${language}. Every question and every option must be in ${language}, and correctAnswer must match one option character-for-character. The source below may be in another language — translate it.`,
    "",
    `Title: ${args.title}`,
    args.prompt?.trim() ? `Focus/angle from the user: ${args.prompt.trim()}` : undefined,
    args.existingQuestions && args.existingQuestions.length > 0
      ? `Existing questions (avoid duplicates):\n- ${args.existingQuestions.slice(0, 40).join("\n- ")}`
      : undefined,
    "",
    "Source content:",
    clamp(args.content),
  ]
    .filter(Boolean)
    .join("\n")
  try {
    const { object } = await generateObject({
      model: openai(MODEL_ID),
      schema: quizzesSchema,
      system,
      prompt: userPrompt,
      maxOutputTokens: MAX_TOKENS_QUIZZES,
    })
    return { questions: object.questions.slice(0, args.count) }
  } catch (err) {
    console.error("[ai/generate] quizzes falling back to mock:", err)
    discordLogger().openaiError({ operation: "generate.quizzes", error: err, context: { model: MODEL_ID } })
    return { questions: mockQuizzes(args) }
  }
}
