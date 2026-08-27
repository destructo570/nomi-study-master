import "server-only"

import { and, desc, eq, isNotNull, lte, sql } from "drizzle-orm"

import { db, schema } from "@workspace/db"

export type FaqItem = { q: string; a: string }
export type HowTo = { name: string; steps: string[] }

export type BlogPost = {
  id: string
  slug: string
  title: string
  description: string
  content: string
  coverImage: string | null
  coverAlt: string | null
  author: string
  tags: string[]
  faq: FaqItem[] | null
  howTo: HowTo | null
  readingMinutes: number
  publishedAt: Date
  updatedAt: Date
}

const publishedFilter = and(
  isNotNull(schema.posts.publishedAt),
  lte(schema.posts.publishedAt, sql`now()`)
)

export async function listPublishedPosts(): Promise<BlogPost[]> {
  const rows = await db
    .select()
    .from(schema.posts)
    .where(publishedFilter)
    .orderBy(desc(schema.posts.publishedAt))

  return rows.map(rowToPost)
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const [row] = await db
    .select()
    .from(schema.posts)
    .where(and(eq(schema.posts.slug, slug), publishedFilter))
    .limit(1)

  return row ? rowToPost(row) : null
}

export async function listAllSlugs(): Promise<string[]> {
  const rows = await db
    .select({ slug: schema.posts.slug })
    .from(schema.posts)
    .where(publishedFilter)
  return rows.map((r) => r.slug)
}

function rowToPost(row: typeof schema.posts.$inferSelect): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    content: row.content,
    coverImage: row.coverImage,
    coverAlt: row.coverAlt,
    author: row.author,
    tags: Array.isArray(row.tags) ? row.tags : [],
    faq: Array.isArray(row.faq) ? (row.faq as FaqItem[]) : null,
    howTo:
      row.howTo && Array.isArray((row.howTo as HowTo)?.steps)
        ? (row.howTo as HowTo)
        : null,
    readingMinutes: row.readingMinutes,
    publishedAt: row.publishedAt ?? row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function formatPublishedDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
