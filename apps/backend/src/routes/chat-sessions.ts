import { Hono } from "hono"
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

import { db } from "@workspace/db"
import { chatMessages, chatSessions } from "@workspace/db/schema"
import { toChat, toChatSession } from "@workspace/db/serialize"

import type { AppEnv } from "../types"
import {
  buildModelMessages,
  compactSessionIfNeeded,
} from "../lib/ai/chat-compaction"
import { generateChatTitle } from "../lib/ai/generate"
import { loadPrompt } from "../lib/ai/prompts"
import { requireOwnedChatSession } from "../lib/ownership"
import { checkQuota, recordQuotaUsage } from "../lib/quota"

const router = new Hono<AppEnv>()

const CHAT_MODEL_ID = "gpt-4o-mini"
const CHAT_MAX_OUTPUT_TOKENS = 1500

router.get("/", async (c) => {
  const userId = c.get("userId")
  // Standalone chats: rows that the current user owns and that are not
  // attached to any notebook. Used by the Home page "My Chats" section.
  const rows = await db
    .select()
    .from(chatSessions)
    .where(
      and(eq(chatSessions.userId, userId), isNull(chatSessions.notebookId)),
    )
    .orderBy(desc(chatSessions.updatedAt))

  // Pull the first user message per session for the list preview. We grab
  // every user message for these sessions ordered by createdAt and keep the
  // first occurrence per sessionId — one SQL round-trip total.
  const sessionIds = rows.map((r) => r.id)
  const previewMap = new Map<string, string>()
  if (sessionIds.length > 0) {
    const userMessages = await db
      .select({
        sessionId: chatMessages.sessionId,
        content: chatMessages.content,
      })
      .from(chatMessages)
      .where(
        and(
          inArray(chatMessages.sessionId, sessionIds),
          eq(chatMessages.role, "user"),
        ),
      )
      .orderBy(asc(chatMessages.createdAt))
    for (const m of userMessages) {
      if (!previewMap.has(m.sessionId)) {
        previewMap.set(m.sessionId, m.content)
      }
    }
  }

  return c.json(
    rows.map((r) => {
      const summary = toChatSession(r)
      const preview = previewMap.get(r.id)
      summary.preview = preview ? preview.slice(0, 200) : null
      return summary
    }),
  )
})

router.get("/:id", async (c) => {
  const id = c.req.param("id")
  const session = await requireOwnedChatSession(c.get("userId"), id)
  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, id))
    .orderBy(asc(chatMessages.createdAt))
  return c.json({
    ...toChatSession(session),
    messages: messages.map(toChat),
  })
})

router.delete("/:id", async (c) => {
  const id = c.req.param("id")
  const userId = c.get("userId")
  await requireOwnedChatSession(userId, id)
  await db
    .delete(chatSessions)
    .where(and(eq(chatSessions.id, id), eq(chatSessions.userId, userId)))
  return c.json({ ok: true })
})

const standaloneStreamSchema = z.object({
  sessionId: z.string().min(1).nullable().optional(),
  userMessage: z.string().min(1),
})

router.post("/stream", async (c) => {
  const body = standaloneStreamSchema.parse(await c.req.json())
  const userId = c.get("userId")

  if (!process.env.OPENAI_API_KEY) {
    return c.json(
      { error: "AI is not configured on the server (OPENAI_API_KEY missing)." },
      503,
    )
  }

  await checkQuota(c, "chat.message")
  const quotaPlan = c.get("userPlan")

  let sessionId = body.sessionId ?? null
  const isNewSession = !sessionId
  let sessionSummary: string | null = null

  if (!sessionId) {
    sessionId = nanoid(10)
    await db.insert(chatSessions).values({
      id: sessionId,
      notebookId: null,
      userId,
      title: null,
    })
  } else {
    const [sess] = await db
      .select()
      .from(chatSessions)
      .where(
        and(
          eq(chatSessions.id, sessionId),
          eq(chatSessions.userId, userId),
        ),
      )
      .limit(1)
    if (!sess || sess.notebookId !== null) {
      return c.json({ error: "Session not found" }, 404)
    }
    sessionSummary = sess.summary ?? null
  }

  const history = isNewSession
    ? []
    : await db
        .select({
          role: chatMessages.role,
          content: chatMessages.content,
        })
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, sessionId))
        .orderBy(asc(chatMessages.createdAt))

  await db.insert(chatMessages).values({
    id: nanoid(10),
    sessionId,
    notebookId: null,
    role: "user",
    content: body.userMessage,
  })

  const persistedSessionId = sessionId

  const allMessages = [
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: body.userMessage },
  ]
  const modelMessages = buildModelMessages({
    allMessages,
    summary: sessionSummary,
  })

  const result = streamText({
    model: openai(CHAT_MODEL_ID),
    system: loadPrompt("chat-standalone"),
    messages: modelMessages,
    maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS,
    abortSignal: c.req.raw.signal,
    onFinish: async ({ text }) => {
      try {
        await db.insert(chatMessages).values({
          id: nanoid(10),
          sessionId: persistedSessionId,
          notebookId: null,
          role: "assistant",
          content: text,
        })
        await db
          .update(chatSessions)
          .set({ updatedAt: sql`now()` })
          .where(eq(chatSessions.id, persistedSessionId))

        await recordQuotaUsage(userId, quotaPlan, "chat.message")

        if (isNewSession) {
          const title = await generateChatTitle({
            userMessage: body.userMessage,
            assistantMessage: text,
          })
          await db
            .update(chatSessions)
            .set({ title })
            .where(eq(chatSessions.id, persistedSessionId))
        }

        void compactSessionIfNeeded(persistedSessionId)
      } catch (err) {
        console.error("[chat/stream standalone] persistence failed:", err)
      }
    },
  })

  const response = result.toTextStreamResponse()
  response.headers.set("X-Session-Id", persistedSessionId)
  return response
})

export default router
