import { eq, sql } from "drizzle-orm"

import { db } from "@workspace/db"
import { notebooks, sources } from "@workspace/db/schema"

import {
  fetchArticle,
  ArticleEmptyError,
  ArticleFetchError,
} from "../lib/extract/article"
import {
  fetchYoutubeTranscript,
  YoutubeFetchError,
  YoutubeNoCaptionsError,
} from "../lib/extract/youtube"
import { discordLogger } from "../lib/logger/discord"
import { getSourceEmbedQueue } from "../lib/queue/embed"
import {
  createUrlIngestWorker,
  type UrlIngestJobData,
} from "../lib/queue/url-ingest"

async function process(data: UrlIngestJobData): Promise<void> {
  const { sourceId } = data

  const [row] = await db.select().from(sources).where(eq(sources.id, sourceId))
  if (!row) throw new Error(`source ${sourceId} not found`)
  if (!row.sourceUrl) throw new Error(`source ${sourceId} missing sourceUrl`)

  await db
    .update(sources)
    .set({ status: "processing", errorMessage: null })
    .where(eq(sources.id, sourceId))

  let text: string
  let resolvedTitle: string | null = null
  let extractedJson: string | null = null

  if (row.type === "youtube") {
    const result = await fetchYoutubeTranscript(row.sourceUrl)
    text = result.text
    resolvedTitle = result.title
    extractedJson = JSON.stringify({
      kind: "youtube",
      videoId: result.videoId,
      language: result.language,
      title: result.title,
      authorName: result.authorName,
      authorUrl: result.authorUrl,
      thumbnailUrl: result.thumbnailUrl,
    })
  } else if (row.type === "article") {
    const result = await fetchArticle(row.sourceUrl)
    text = result.markdown
    resolvedTitle = result.title
    extractedJson = JSON.stringify({
      kind: "article",
      url: result.url,
      title: result.title,
      description: result.description,
      thumbnailUrl: result.thumbnailUrl,
    })
  } else {
    throw new Error(`url-ingest: unsupported source type ${row.type}`)
  }

  // Only override the title if the user didn't provide a meaningful one.
  // We seed `title` with the URL itself when no title is supplied, so the
  // upgrade is welcome there; if the user typed a real title we keep it.
  const shouldOverrideTitle =
    !!resolvedTitle &&
    (row.title === row.sourceUrl || row.title.trim().length === 0)

  await db
    .update(sources)
    .set({
      status: "ready",
      content: text,
      extractedText: extractedJson,
      title: shouldOverrideTitle ? resolvedTitle! : row.title,
      processedAt: new Date(),
      errorMessage: null,
    })
    .where(eq(sources.id, sourceId))

  // The home-hero quick action and similar flows auto-create a notebook
  // with the URL as its title. Once we have a real title, rename the
  // notebook too — but only when its current title still matches the URL,
  // so we never overwrite a name the user picked themselves.
  if (resolvedTitle) {
    await db
      .update(notebooks)
      .set({ title: resolvedTitle, updatedAt: sql`now()` })
      .where(
        sql`${notebooks.id} = ${row.notebookId} AND ${notebooks.title} = ${row.sourceUrl}`,
      )
  }

  if (text.trim().length > 0) {
    try {
      await getSourceEmbedQueue().add("embed", { sourceId })
    } catch (err) {
      console.error(`[url-ingest] failed to enqueue embed for ${sourceId}:`, err)
      discordLogger().error(
        `Failed to enqueue embed job for source ${sourceId}`,
        err,
      )
    }
  }
}

function userFacingError(err: unknown): string {
  if (err instanceof YoutubeNoCaptionsError) {
    return "This video has no captions. Try uploading the audio file instead."
  }
  if (err instanceof YoutubeFetchError) {
    if (err.status === 404) return "This video doesn't exist or is private."
    if (err.status === 422) return "That doesn't look like a valid YouTube URL."
    return `Couldn't fetch the transcript (${err.status}).`
  }
  if (err instanceof ArticleEmptyError) {
    return "We couldn't extract any readable content from this page."
  }
  if (err instanceof ArticleFetchError) {
    if (err.status === 404) return "This page returned 404."
    if (err.status === 401 || err.status === 403) {
      return "This page is paywalled or blocks scraping."
    }
    return `Couldn't fetch this page (${err.status}).`
  }
  return err instanceof Error ? err.message : String(err)
}

function isRetryable(err: unknown): boolean {
  if (err instanceof YoutubeNoCaptionsError) return false
  if (err instanceof YoutubeFetchError) {
    return err.status === 408 || err.status === 429 || err.status >= 500
  }
  if (err instanceof ArticleEmptyError) return false
  if (err instanceof ArticleFetchError) {
    return err.status === 408 || err.status === 429 || err.status >= 500
  }
  // Network / unknown errors → let BullMQ retry once.
  return true
}

export function startUrlIngestWorker(): void {
  const worker = createUrlIngestWorker(async (job) => {
    try {
      await process(job.data)
    } catch (err) {
      const message = userFacingError(err)
      // For non-retryable errors, mark failed immediately so the user
      // sees the real reason instead of "still processing" until retries
      // exhaust. For retryable ones, leave status=processing and let
      // BullMQ try again; the final failure handler below will mark it.
      if (!isRetryable(err)) {
        await db
          .update(sources)
          .set({ status: "failed", errorMessage: message })
          .where(eq(sources.id, job.data.sourceId))
      }
      throw err
    }
  })

  worker.on("failed", async (job, err) => {
    if (!job) return
    const attemptsAllowed = job.opts.attempts ?? 1
    if (job.attemptsMade < attemptsAllowed) return
    const message = userFacingError(err)
    await db
      .update(sources)
      .set({ status: "failed", errorMessage: message })
      .where(eq(sources.id, job.data.sourceId))
    console.error(`[url-ingest] job ${job.id} failed:`, message)
    discordLogger().error(`URL ingest failed (${job.id ?? "?"})`, err)
  })
  worker.on("completed", (job) => {
    console.log(
      `[url-ingest] job ${job.id} completed for source ${job.data.sourceId}`,
    )
  })
  console.log("[url-ingest] started")
}
