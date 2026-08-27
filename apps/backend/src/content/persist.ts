/**
 * Optional persistence. Blog → existing `posts`; others → `seo_pages`. Jobs
 * → `seo_jobs`. Generation never publishes on its own — `publishedAt` stays
 * null until a separate publish action (admin route).
 */
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"

import { db } from "@workspace/db"
import { posts, seoJobs, seoPages } from "@workspace/db/schema"

import type { ContentType, GenerationResult, JobStatus } from "./schemas"

const BLOG = "blog"

export async function persistResult(
  result: GenerationResult,
  opts: { published?: boolean } = {},
): Promise<{ id: string; table: "posts" | "seo_pages" }> {
  const c = result.json

  if (c.type === BLOG) {
    const id = nanoid()
    const [inserted] = await db
      .insert(posts)
      .values({
        id,
        slug: c.seo.slug,
        title: c.seo.title,
        description: c.seo.metaDescription,
        content: result.markdown,
        tags: c.seo.relatedKeywords,
        faq: c.faq.map((f) => ({ q: f.q, a: f.a })),
        readingMinutes: c.seo.readingMinutes,
        publishedAt: opts.published ? new Date() : null,
      })
      .returning({ id: posts.id })
    if (!inserted) throw new Error("post insert failed")
    return { id: inserted.id!, table: "posts" }
  }

  const id = nanoid()
  const [inserted] = await db
    .insert(seoPages)
    .values({
      id,
      type: c.type,
      slug: c.seo.slug,
      title: c.seo.title,
      description: c.seo.metaDescription,
      content: result.markdown,
      tags: c.seo.relatedKeywords,
      faq: c.faq.map((f) => ({ q: f.q, a: f.a })),
      payload: c as unknown as Record<string, unknown>,
      score: result.score.overall,
      publishedAt: opts.published ? new Date() : null,
    })
    .returning({ id: seoPages.id })
  if (!inserted) throw new Error("seo_pages insert failed")
  return { id: inserted.id as string, table: "seo_pages" }
}

export async function upsertResult(
  result: GenerationResult,
  opts: { published?: boolean } = {},
): Promise<{ id: string; table: "posts" | "seo_pages" }> {
  const type = (result.meta?.contentType ?? result.json.type) as ContentType
  const slug = result.json.seo.slug
  if (type === BLOG) {
    await db.delete(posts).where(eq(posts.slug, slug))
  } else {
    await db.delete(seoPages).where(eq(seoPages.slug, slug))
  }
  return persistResult(result, opts)
}

export async function persistJobStatus(job: JobStatus): Promise<void> {
  const row = {
    id: job.id,
    type: job.type,
    topic: job.topic,
    status: job.status,
    score: job.score,
    payload: job as unknown as Record<string, unknown>,
    resultId: job.resultId,
    startedAt: null,
    finishedAt: null,
  }
  // upsert by id — delete-then-insert keeps it simple and idempotent.
  await db.delete(seoJobs).where(eq(seoJobs.id, job.id)).catch(() => {})
  await db.insert(seoJobs).values(row)
}