import { asc, eq } from "drizzle-orm"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

import { db } from "@workspace/db"
import { chatMessages, chatSessions } from "@workspace/db/schema"

import { discordLogger } from "../logger/discord"

import { loadPrompt } from "./prompts"

const MODEL_ID = "gpt-4o-mini"
const WINDOW_SIZE = 10
const DEFAULT_TOKEN_BUDGET = 8000
// Hard cap on the summary itself — without it a "compaction" can balloon
// past the input it was meant to replace.
const MAX_SUMMARY_TOKENS = 1500

export type ModelMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

export type ChatHistoryMessage = {
  id: string
  role: string
  content: string
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

function tokenBudget(): number {
  const raw = Number(process.env.CHAT_SUMMARY_TOKEN_BUDGET)
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TOKEN_BUDGET
}

export function buildModelMessages(args: {
  allMessages: ModelMessage[]
  summary: string | null
  windowSize?: number
}): ModelMessage[] {
  const window = args.windowSize ?? WINDOW_SIZE
  if (!args.summary) return args.allMessages
  const tail = args.allMessages.slice(-window)
  return [
    {
      role: "system",
      content: `Conversation summary so far:\n${args.summary}`,
    },
    ...tail,
  ]
}

function formatMessagesForSummary(messages: ChatHistoryMessage[]): string {
  return messages
    .map((m) => `[${m.role.toUpperCase()}]\n${m.content}`)
    .join("\n\n")
}

export async function compactSessionIfNeeded(sessionId: string): Promise<void> {
  if (!process.env.OPENAI_API_KEY) return

  try {
    const rows = await db
      .select({
        id: chatMessages.id,
        role: chatMessages.role,
        content: chatMessages.content,
      })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.createdAt))

    if (rows.length <= WINDOW_SIZE) return

    const total = rows.reduce((sum, m) => sum + estimateTokens(m.content), 0)
    if (total < tokenBudget()) return

    const olderMessages = rows.slice(0, rows.length - WINDOW_SIZE)
    if (olderMessages.length === 0) return
    const lastSummarizedId = olderMessages[olderMessages.length - 1]!.id

    const [sess] = await db
      .select({ summary: chatSessions.summary })
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1)
    if (!sess) return

    const priorBlock = sess.summary
      ? `Prior summary (integrate, do not append):\n${sess.summary}\n\n`
      : ""
    const prompt = `${priorBlock}New messages to fold in:\n\n${formatMessagesForSummary(olderMessages)}`

    const { text } = await generateText({
      model: openai(MODEL_ID),
      system: loadPrompt("chat-summary"),
      prompt,
      maxOutputTokens: MAX_SUMMARY_TOKENS,
    })

    const summary = text.trim()
    if (!summary) return

    await db
      .update(chatSessions)
      .set({
        summary,
        summaryUpToMessageId: lastSummarizedId,
        summaryUpdatedAt: new Date(),
      })
      .where(eq(chatSessions.id, sessionId))
  } catch (err) {
    console.error("[chat-compaction] failed:", err)
    discordLogger().openaiError({
      operation: "chat.compactSession",
      error: err,
      context: { model: MODEL_ID, sessionId },
    })
  }
}
