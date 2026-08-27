import { promises as fs } from "node:fs"
import path from "node:path"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { and, count, desc, eq } from "drizzle-orm"
import { Hono } from "hono"
import { z } from "zod"

import { db } from "@workspace/db"
import { notebooks, sourceChunks, sources } from "@workspace/db/schema"

import type { AppEnv } from "../types"
import {
  chunkPdfStructured,
  chunkPlainText,
  type Chunk,
} from "../lib/rag/chunk"
import { loadPrompt } from "../lib/ai/prompts"
import { embedTexts } from "../lib/rag/embed"
import type {
  PdfBlock,
  PdfPage,
  PdfParseResult,
} from "../lib/extract/pdf-parser-service"
import { searchChunksBySource, type SearchHit } from "../lib/rag/search"

const router = new Hono<AppEnv>()

const CHAT_MODEL_ID = "gpt-4o-mini"
const TOP_K = 8
const SKIP_RETRIEVAL_K = 5
const RAW_MAX_CHARS = 50_000
const RAW_MAX_CHUNKS = 200
const NO_ANSWER_QUERY =
  "What is the average migration pattern of Antarctic emperor penguins during the late Pleistocene era?"

export type LlmTestDocument = {
  id: string
  notebookId: string
  notebookTitle: string
  title: string
  status: string
  mimeType: string | null
  fileName: string | null
  chunkCount: number
  indexedAt: string | null
  createdAt: string
}

export type LlmTestChunk = {
  id: string
  sourceId: string
  sourceTitle: string
  page: number
  text: string
  score: number
}

export type LlmTestMetrics = {
  totalLatencyMs: number
  embeddingMs: number
  retrievalMs: number
  generationMs: number
  chunksUsed: number
  contextChars: number
  contextTokensApprox: number
  citedIndices: number[]
}

export type LlmTestResponse = {
  query: string
  answer: string
  chunks: LlmTestChunk[]
  metrics: LlmTestMetrics
  systemPrompt: string
  finalPrompt: string
  noAnswer: boolean
}

router.get("/documents", async (c) => {
  const userId = c.get("userId")
  const rows = await db
    .select({
      id: sources.id,
      notebookId: sources.notebookId,
      notebookTitle: notebooks.title,
      title: sources.title,
      status: sources.status,
      mimeType: sources.mimeType,
      fileName: sources.fileName,
      indexedAt: sources.indexedAt,
      createdAt: sources.createdAt,
      chunkCount: count(sourceChunks.id),
    })
    .from(sources)
    .innerJoin(notebooks, eq(notebooks.id, sources.notebookId))
    .leftJoin(sourceChunks, eq(sourceChunks.sourceId, sources.id))
    .where(eq(notebooks.userId, userId))
    .groupBy(sources.id, notebooks.id)
    .orderBy(desc(sources.createdAt))

  const out: LlmTestDocument[] = rows.map((r) => ({
    id: r.id,
    notebookId: r.notebookId,
    notebookTitle: r.notebookTitle,
    title: r.title,
    status: r.status,
    mimeType: r.mimeType,
    fileName: r.fileName,
    chunkCount: Number(r.chunkCount ?? 0),
    indexedAt: r.indexedAt ? r.indexedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }))
  return c.json(out)
})

const querySchema = z.object({
  docId: z.string().min(1),
  query: z.string().min(1),
})

const noAnswerSchema = z.object({
  docId: z.string().min(1),
})

function formatRetrievedContext(hits: SearchHit[]): string {
  return hits
    .map(
      (h, i) =>
        `[${i + 1}] (source: ${h.sourceTitle}, p.${h.page})\n${h.text}`,
    )
    .join("\n\n")
}

function extractCitedIndices(answer: string): number[] {
  const re = /\[(\d+)\]/g
  const seen = new Set<number>()
  let m: RegExpExecArray | null
  while ((m = re.exec(answer)) !== null) {
    const n = Number(m[1])
    if (Number.isFinite(n)) seen.add(n)
  }
  return Array.from(seen).sort((a, b) => a - b)
}

async function loadDocumentForUser(
  docId: string,
  userId: string,
): Promise<{
  source: typeof sources.$inferSelect
  notebookTitle: string
} | null> {
  const [row] = await db
    .select({
      source: sources,
      notebookTitle: notebooks.title,
    })
    .from(sources)
    .innerJoin(notebooks, eq(notebooks.id, sources.notebookId))
    .where(and(eq(sources.id, docId), eq(notebooks.userId, userId)))
    .limit(1)
  if (!row) return null
  return { source: row.source, notebookTitle: row.notebookTitle }
}

async function runQuery(opts: {
  query: string
  docId: string
  userId: string
  noAnswer: boolean
}): Promise<LlmTestResponse | { error: string; status: number }> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      error: "AI is not configured on the server (OPENAI_API_KEY missing).",
      status: 503,
    }
  }

  const doc = await loadDocumentForUser(opts.docId, opts.userId)
  if (!doc) return { error: "Document not found", status: 404 }
  if (doc.source.status !== "ready") {
    return { error: `Document is not ready (status=${doc.source.status})`, status: 409 }
  }

  const totalStart = Date.now()

  const embedStart = Date.now()
  const [queryEmbedding] = await embedTexts([opts.query])
  const embeddingMs = Date.now() - embedStart
  if (!queryEmbedding) {
    return { error: "Failed to embed query", status: 500 }
  }

  const retrievalStart = Date.now()
  const hits = await searchChunksBySource(opts.docId, queryEmbedding, TOP_K)
  const retrievalMs = Date.now() - retrievalStart

  const contextBlock = hits.length
    ? `Retrieved passages from the document (use these as the authoritative context; cite them as [n] when you reference them):\n\n${formatRetrievedContext(hits)}`
    : "No relevant passages were retrieved from this document for the user's question. Be candid if you cannot answer from general knowledge."

  const systemPrompt = `${loadPrompt("llm-test-document", {
    docTitle: doc.source.title,
    notebookTitle: doc.notebookTitle,
  })}\n\n${contextBlock}`

  const generationStart = Date.now()
  const { text: answer } = await generateText({
    model: openai(CHAT_MODEL_ID),
    system: systemPrompt,
    prompt: opts.query,
  })
  const generationMs = Date.now() - generationStart

  const totalLatencyMs = Date.now() - totalStart
  const contextChars = contextBlock.length
  const contextTokensApprox = Math.ceil(contextChars / 4)

  return {
    query: opts.query,
    answer,
    chunks: hits.map((h) => ({
      id: h.id,
      sourceId: h.sourceId,
      sourceTitle: h.sourceTitle,
      page: h.page,
      text: h.text,
      score: h.score,
    })),
    metrics: {
      totalLatencyMs,
      embeddingMs,
      retrievalMs,
      generationMs,
      chunksUsed: hits.length,
      contextChars,
      contextTokensApprox,
      citedIndices: extractCitedIndices(answer),
    },
    systemPrompt,
    finalPrompt: `SYSTEM:\n${systemPrompt}\n\nUSER:\n${opts.query}`,
    noAnswer: opts.noAnswer,
  }
}

router.post("/query", async (c) => {
  const userId = c.get("userId")
  const body = querySchema.parse(await c.req.json())
  const result = await runQuery({
    query: body.query,
    docId: body.docId,
    userId,
    noAnswer: false,
  })
  if ("error" in result) {
    return c.json({ error: result.error }, result.status as 400 | 404 | 409 | 500 | 503)
  }
  return c.json(result)
})

router.post("/no-answer", async (c) => {
  const userId = c.get("userId")
  const body = noAnswerSchema.parse(await c.req.json())
  const result = await runQuery({
    query: NO_ANSWER_QUERY,
    docId: body.docId,
    userId,
    noAnswer: true,
  })
  if ("error" in result) {
    return c.json({ error: result.error }, result.status as 400 | 404 | 409 | 500 | 503)
  }
  return c.json(result)
})

const rawSchema = z.object({
  input: z.string().min(1).max(RAW_MAX_CHARS),
  query: z.string().min(1).optional(),
  skipRetrieval: z.boolean().optional(),
  noAnswer: z.boolean().optional(),
})

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let na = 0
  let nb = 0
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const av = a[i]!
    const bv = b[i]!
    dot += av * bv
    na += av * av
    nb += bv * bv
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom === 0 ? 0 : dot / denom
}

function normalizeStructured(parsed: unknown): PdfParseResult | null {
  if (!parsed || typeof parsed !== "object") return null
  const obj = parsed as { pages?: unknown }
  if (!Array.isArray(obj.pages)) return null
  const pages: PdfPage[] = []
  for (const raw of obj.pages) {
    if (!raw || typeof raw !== "object") continue
    const p = raw as { page?: unknown; text?: unknown; blocks?: unknown }
    const pageNum = Number(p.page) || pages.length + 1
    if (Array.isArray(p.blocks)) {
      const blocks: PdfBlock[] = []
      for (const b of p.blocks) {
        if (!b || typeof b !== "object") continue
        const bb = b as { type?: unknown; text?: unknown; bbox?: unknown }
        if (typeof bb.text !== "string") continue
        blocks.push({
          type: bb.type === "heading" ? "heading" : "paragraph",
          text: bb.text,
          bbox: null,
        })
      }
      if (blocks.length > 0) pages.push({ page: pageNum, blocks })
      continue
    }
    if (typeof p.text === "string" && p.text.trim().length > 0) {
      pages.push({
        page: pageNum,
        blocks: [{ type: "paragraph", text: p.text, bbox: null }],
      })
    }
  }
  if (pages.length === 0) return null
  return { pageCount: pages.length, needsOCR: false, pages }
}

function chunksFromRawInput(input: string): {
  chunks: Chunk[]
  mode: "structured" | "plain"
} {
  if (input.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(input)
      const structured = normalizeStructured(parsed)
      if (structured) {
        return { chunks: chunkPdfStructured(structured), mode: "structured" }
      }
    } catch {
      // fall through to plain text
    }
  }
  return { chunks: chunkPlainText(input), mode: "plain" }
}

router.post("/raw", async (c) => {
  if (!process.env.OPENAI_API_KEY) {
    return c.json(
      { error: "AI is not configured on the server (OPENAI_API_KEY missing)." },
      503,
    )
  }
  const body = rawSchema.parse(await c.req.json())
  const noAnswer = body.noAnswer === true
  const userQuery = noAnswer ? NO_ANSWER_QUERY : body.query?.trim()
  if (!userQuery) {
    return c.json({ error: "Query is required" }, 400)
  }

  const totalStart = Date.now()
  const { chunks, mode } = chunksFromRawInput(body.input)
  if (chunks.length === 0) {
    return c.json(
      { error: "Input produced no usable chunks (too short or empty)." },
      400,
    )
  }
  if (chunks.length > RAW_MAX_CHUNKS) {
    return c.json(
      {
        error: `Input produced too many chunks (${chunks.length} > ${RAW_MAX_CHUNKS}).`,
      },
      400,
    )
  }

  let hits: SearchHit[]
  let embeddingMs = 0
  let retrievalMs = 0

  if (body.skipRetrieval) {
    const selected = chunks.slice(0, SKIP_RETRIEVAL_K)
    hits = selected.map((ch, i) => ({
      id: `raw-${i}`,
      sourceId: "__raw__",
      sourceTitle: "(raw input)",
      page: ch.page,
      text: ch.text,
      score: 1,
    }))
  } else {
    const embedStart = Date.now()
    const allTexts = [userQuery, ...chunks.map((ch) => ch.text)]
    const embeddings = await embedTexts(allTexts)
    embeddingMs = Date.now() - embedStart
    const queryEmbedding = embeddings[0]
    if (!queryEmbedding) {
      return c.json({ error: "Failed to embed query" }, 500)
    }

    const retrievalStart = Date.now()
    const scored = chunks.map((ch, i) => ({
      ch,
      i,
      score: cosineSimilarity(queryEmbedding, embeddings[i + 1] ?? []),
    }))
    scored.sort((a, b) => b.score - a.score)
    const top = scored.slice(0, TOP_K)
    retrievalMs = Date.now() - retrievalStart
    hits = top.map(({ ch, i, score }) => ({
      id: `raw-${i}`,
      sourceId: "__raw__",
      sourceTitle: "(raw input)",
      page: ch.page,
      text: ch.text,
      score,
    }))
  }

  const contextBlock = hits.length
    ? `Retrieved passages from the input (use these as the authoritative context; cite them as [n] when you reference them):\n\n${formatRetrievedContext(hits)}`
    : "No relevant passages were retrieved. Be candid if you cannot answer."

  const sourceLabel = mode === "structured" ? "raw structured input" : "raw text input"
  const systemPrompt = `${loadPrompt("llm-test-raw", {
    sourceLabel,
  })}\n\n${contextBlock}`

  const generationStart = Date.now()
  const { text: answer } = await generateText({
    model: openai(CHAT_MODEL_ID),
    system: systemPrompt,
    prompt: userQuery,
  })
  const generationMs = Date.now() - generationStart

  const totalLatencyMs = Date.now() - totalStart
  const contextChars = contextBlock.length
  const contextTokensApprox = Math.ceil(contextChars / 4)

  const response: LlmTestResponse = {
    query: userQuery,
    answer,
    chunks: hits.map((h) => ({
      id: h.id,
      sourceId: h.sourceId,
      sourceTitle: h.sourceTitle,
      page: h.page,
      text: h.text,
      score: h.score,
    })),
    metrics: {
      totalLatencyMs,
      embeddingMs,
      retrievalMs,
      generationMs,
      chunksUsed: hits.length,
      contextChars,
      contextTokensApprox,
      citedIndices: extractCitedIndices(answer),
    },
    systemPrompt,
    finalPrompt: `SYSTEM:\n${systemPrompt}\n\nUSER:\n${userQuery}`,
    noAnswer,
  }
  return c.json(response)
})

const evalSchema = z.object({
  docId: z.string().min(1),
  query: z.string().min(1),
  rating: z.enum(["correct", "partial", "wrong", "hallucination"]),
  answer: z.string().optional(),
  notes: z.string().optional(),
})

const EVAL_FILE = path.resolve(process.cwd(), "debug/llm-test-evals.jsonl")

router.post("/eval", async (c) => {
  const userId = c.get("userId")
  const body = evalSchema.parse(await c.req.json())
  const entry = {
    createdAt: new Date().toISOString(),
    userId,
    docId: body.docId,
    query: body.query,
    rating: body.rating,
    answer: body.answer ?? null,
    notes: body.notes ?? null,
  }
  await fs.mkdir(path.dirname(EVAL_FILE), { recursive: true })
  await fs.appendFile(EVAL_FILE, `${JSON.stringify(entry)}\n`, "utf8")
  return c.json({ ok: true })
})

export default router
