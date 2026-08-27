import { createHash } from "node:crypto"

import { and, eq, inArray } from "drizzle-orm"
import { nanoid } from "nanoid"
import { SUPPORTED_UPLOAD_MIMES } from "@workspace/types"
import { maxChunksPerDoc } from "@workspace/types/plan"

import { db } from "@workspace/db"
import { notebooks, sourceChunks, sources } from "@workspace/db/schema"

import type { PdfParseResult } from "../lib/extract/pdf-parser-service"
import { discordLogger } from "../lib/logger/discord"
import { createEmbedWorker, type EmbedJobData } from "../lib/queue/embed"
import { chunkPdfStructured, chunkPlainText, type Chunk } from "../lib/rag/chunk"
import { embedTexts } from "../lib/rag/embed"
import { getUserPlanForSource } from "../lib/user-plan"

function hashChunk(text: string): string {
  return createHash("sha256").update(text).digest("hex")
}

/**
 * Look up embeddings the current user has already paid to compute for chunks
 * with the same text. Scoped to the user (via notebook→userId) so we don't
 * leak embeddings across accounts. Returns a map from content_hash to one
 * representative embedding row.
 */
async function findExistingEmbeddings(
  userId: string,
  hashes: string[],
): Promise<Map<string, number[]>> {
  const out = new Map<string, number[]>()
  if (hashes.length === 0) return out
  const rows = await db
    .select({
      hash: sourceChunks.contentHash,
      embedding: sourceChunks.embedding,
    })
    .from(sourceChunks)
    .innerJoin(notebooks, eq(notebooks.id, sourceChunks.notebookId))
    .where(
      and(
        eq(notebooks.userId, userId),
        inArray(sourceChunks.contentHash, hashes),
      ),
    )
  for (const row of rows) {
    if (!row.hash || out.has(row.hash)) continue
    out.set(row.hash, row.embedding as number[])
  }
  return out
}

async function process(data: EmbedJobData): Promise<void> {
  const { sourceId } = data
  const startedAt = Date.now()

  const [row] = await db.select().from(sources).where(eq(sources.id, sourceId))
  if (!row) throw new Error(`source ${sourceId} not found`)

  let chunks: Chunk[]
  if (row.mimeType === SUPPORTED_UPLOAD_MIMES.pdf) {
    if (!row.extractedText) {
      throw new Error(`source ${sourceId} has no extractedText to index`)
    }
    let structured: PdfParseResult
    try {
      structured = JSON.parse(row.extractedText) as PdfParseResult
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new Error(
        `source ${sourceId} extractedText is not valid JSON: ${message}`,
      )
    }
    chunks = chunkPdfStructured(structured)
  } else {
    const text = row.content?.trim() ?? ""
    if (!text) {
      throw new Error(`source ${sourceId} has no content to index`)
    }
    chunks = chunkPlainText(text)
  }
  if (chunks.length === 0) {
    await db
      .update(sources)
      .set({ indexedAt: new Date(), indexError: null })
      .where(eq(sources.id, sourceId))
    return
  }

  const plan = await getUserPlanForSource(sourceId)
  const limit = maxChunksPerDoc(plan)
  if (chunks.length > limit) {
    throw new Error(
      `chunk count ${chunks.length} exceeds the ${limit}-chunk limit for this plan`,
    )
  }

  // Look up existing embeddings for this user's chunks with identical text;
  // a re-uploaded or retried file should not pay OpenAI twice for the same
  // bytes. Only chunks not already cached go through embedTexts.
  const hashes = chunks.map((c) => hashChunk(c.text))
  const ownerRow = await db
    .select({ userId: notebooks.userId })
    .from(notebooks)
    .where(eq(notebooks.id, row.notebookId))
    .limit(1)
  const userId = ownerRow[0]?.userId ?? null
  const cache = userId
    ? await findExistingEmbeddings(userId, [...new Set(hashes)])
    : new Map<string, number[]>()

  const novelIndexes: number[] = []
  const novelTexts: string[] = []
  for (let i = 0; i < chunks.length; i++) {
    if (!cache.has(hashes[i]!)) {
      novelIndexes.push(i)
      novelTexts.push(chunks[i]!.text)
    }
  }

  discordLogger().embedStart({
    sourceId,
    chunkCount: chunks.length,
    cachedCount: chunks.length - novelTexts.length,
  })

  const novelEmbeddings = await embedTexts(novelTexts)
  if (novelEmbeddings.length !== novelTexts.length) {
    throw new Error(
      `embedding count mismatch: expected ${novelTexts.length}, got ${novelEmbeddings.length}`,
    )
  }

  const embeddings = new Array<number[]>(chunks.length)
  for (let i = 0; i < chunks.length; i++) {
    const cached = cache.get(hashes[i]!)
    if (cached) embeddings[i] = cached
  }
  for (let i = 0; i < novelIndexes.length; i++) {
    embeddings[novelIndexes[i]!] = novelEmbeddings[i]!
  }

  await db.transaction(async (tx) => {
    await tx.delete(sourceChunks).where(eq(sourceChunks.sourceId, sourceId))
    const rows = chunks.map((c, i) => ({
      id: nanoid(12),
      sourceId,
      notebookId: row.notebookId,
      page: c.page,
      ord: c.ord,
      text: c.text,
      tokenCount: c.tokenCount,
      embedding: embeddings[i]!,
      contentHash: hashes[i]!,
    }))
    for (let i = 0; i < rows.length; i += 200) {
      await tx.insert(sourceChunks).values(rows.slice(i, i + 200))
    }
    await tx
      .update(sources)
      .set({ indexedAt: new Date(), indexError: null })
      .where(eq(sources.id, sourceId))
  })

  discordLogger().embedCompleted({
    sourceId,
    durationMs: Date.now() - startedAt,
    chunkCount: chunks.length,
    vectorCount: embeddings.length,
  })
}

export function startSourceEmbedWorker(): void {
  const worker = createEmbedWorker(async (job) => {
    try {
      await process(job.data)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await db
        .update(sources)
        .set({ indexError: message })
        .where(eq(sources.id, job.data.sourceId))
      discordLogger().embedError({ sourceId: job.data.sourceId, error: err })
      throw err
    }
  })

  worker.on("failed", (job, err) => {
    console.error(`[embed-worker] job ${job?.id} failed:`, err.message)
  })
  worker.on("completed", (job) => {
    console.log(
      `[embed-worker] job ${job.id} completed for source ${job.data.sourceId}`,
    )
  })
  console.log("[embed-worker] started")
}
