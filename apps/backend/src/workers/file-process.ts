import { eq } from "drizzle-orm"

import { db } from "@workspace/db"
import { sources } from "@workspace/db/schema"
import { SUPPORTED_UPLOAD_MIMES, uploadKindForMime } from "@workspace/types"
import { mediaDurationLimitSec } from "@workspace/types/plan"

import { extractDocxText } from "../lib/extract/docx"
import { extractMediaText } from "../lib/extract/media"
import { extractPdfText } from "../lib/extract/pdf"
import { extractTxtText } from "../lib/extract/txt"
import { discordLogger } from "../lib/logger/discord"
import { createWorker, type FileProcessJobData } from "../lib/queue"
import { getSourceEmbedQueue } from "../lib/queue/embed"
import { checkQuotaForUser, recordQuotaUsage } from "../lib/quota"
import { downloadObjectToBuffer } from "../lib/storage/r2"
import { getUserAndPlanForSource, getUserPlanForSource } from "../lib/user-plan"

async function process(data: FileProcessJobData): Promise<void> {
  const { sourceId } = data

  const [row] = await db.select().from(sources).where(eq(sources.id, sourceId))
  if (!row) throw new Error(`source ${sourceId} not found`)
  if (!row.storageKey || !row.mimeType) {
    throw new Error(`source ${sourceId} missing storageKey/mimeType`)
  }

  await db
    .update(sources)
    .set({ status: "processing", errorMessage: null })
    .where(eq(sources.id, sourceId))

  const buf = await downloadObjectToBuffer(row.storageKey)

  const isMedia = uploadKindForMime(row.mimeType) === "media"
  const startedAt = isMedia ? Date.now() : 0

  if (isMedia) {
    discordLogger().transcriptionStart({
      sourceId,
      fileName: row.fileName,
      mimeType: row.mimeType,
      sizeBytes: buf.byteLength,
    })
  }

  let text: string
  let mediaChunkCount = 0
  let pdfStructuredJson: string | null = null
  try {
    if (row.mimeType === SUPPORTED_UPLOAD_MIMES.pdf) {
      const plan = await getUserPlanForSource(sourceId)
      const { markdown, structured } = await extractPdfText(buf, plan)
      text = markdown
      pdfStructuredJson = JSON.stringify(structured)
    } else if (row.mimeType === SUPPORTED_UPLOAD_MIMES.docx) {
      text = await extractDocxText(buf)
    } else if (row.mimeType === SUPPORTED_UPLOAD_MIMES.txt) {
      text = extractTxtText(buf)
    } else if (isMedia) {
      const owner = await getUserAndPlanForSource(sourceId)
      if (!owner) throw new Error(`source ${sourceId} has no owner`)
      // Quota gate before any transcription work — keeps Whisper bills
      // bounded per user/month even if duration cap is bypassed.
      await checkQuotaForUser(owner.userId, owner.plan, "media.transcribe")
      const result = await extractMediaText({
        buffer: buf,
        mimeType: row.mimeType,
        sourceId,
        fileName: row.fileName,
        maxDurationSec: mediaDurationLimitSec(owner.plan),
      })
      text = result.text
      mediaChunkCount = result.chunkCount
      await recordQuotaUsage(owner.userId, owner.plan, "media.transcribe")
    } else {
      throw new Error(`unsupported mime type: ${row.mimeType}`)
    }
  } catch (err) {
    if (isMedia) {
      discordLogger().transcriptionError({
        sourceId,
        durationMs: Date.now() - startedAt,
        error: err,
      })
    }
    throw err
  }

  await db
    .update(sources)
    .set({
      status: "ready",
      extractedText: pdfStructuredJson ?? text,
      content: text,
      processedAt: new Date(),
      errorMessage: null,
    })
    .where(eq(sources.id, sourceId))

  if (text.trim().length > 0) {
    try {
      await getSourceEmbedQueue().add("embed", { sourceId })
    } catch (err) {
      console.error(`[file-worker] failed to enqueue embed for ${sourceId}:`, err)
      discordLogger().error(
        `Failed to enqueue embed job for source ${sourceId}`,
        err,
      )
    }
  }

  if (isMedia) {
    discordLogger().transcriptionCompleted({
      sourceId,
      durationMs: Date.now() - startedAt,
      chunkCount: mediaChunkCount,
      textLength: text.length,
    })
  }
}

export function startFileProcessWorker(): void {
  const worker = createWorker(async (job) => {
    try {
      await process(job.data)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await db
        .update(sources)
        .set({ status: "failed", errorMessage: message })
        .where(eq(sources.id, job.data.sourceId))
      throw err
    }
  })

  worker.on("failed", async (job, err) => {
    console.error(`[file-worker] job ${job?.id} failed:`, err.message)
    discordLogger().error(
      `File worker job failed (${job?.id ?? "?"})`,
      err,
    )
  })
  worker.on("completed", (job) => {
    console.log(`[file-worker] job ${job.id} completed for source ${job.data.sourceId}`)
  })
  console.log("[file-worker] started")
}
