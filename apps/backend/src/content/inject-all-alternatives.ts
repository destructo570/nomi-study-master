/// One-off: inject all alternatives blog posts into the posts table.
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"

import { db } from "@workspace/db"
import { posts } from "@workspace/db/schema"

const BLOG_DIR = resolve(import.meta.dir, "../../../web/app/blog")

const FILES = [
  "quizlet-alternatives.md",
  "anki-alternatives.md",
  "notebooklm-alternatives.md",
  "studyfetch-alternatives.md",
  "knowt-alternatives.md",
]

function parseFrontmatter(raw: string) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!m) throw new Error("no frontmatter found")
  const fm = m[1]!
  const body = m[2]!

  const get = (key: string) => {
    const line = fm.match(new RegExp(`^${key}:\\s+"(.*)"$`, "m"))
    return line?.[1] ?? null
  }
  const title = get("title")!
  const description = get("description")!
  const author = get("author") ?? "nomi team"
  const image = get("image")
  const date = get("date")

  const tagsMatch = fm.match(/^tags:\n((?:  - .*\n)+)/m)
  const tags = tagsMatch
    ? [...tagsMatch[1]!.matchAll(/- (.+)/g)].map((m) => m[1]!.trim())
    : []

  const keywordsMatch = fm.match(/^keywords:\n((?:  - .*\n)+)/m)
  const keywords = keywordsMatch
    ? [...keywordsMatch[1]!.matchAll(/- (.+)/g)].map((m) => m[1]!.trim())
    : []

  return { title, description, author, image, date, tags, keywords, body }
}

function extractFaq(body: string) {
  const faqSection = body.split(/^# Frequently Asked Questions$/m)[1] ?? ""
  const blockHeading = faqSection.split(/^# /m)[0] ?? faqSection
  const qas: { q: string; a: string }[] = []
  const blocks = blockHeading.split(/^## /m).slice(1)
  for (const b of blocks) {
    const lines = b.trim().split("\n")
    const q = lines[0]!.trim()
    const a = lines.slice(1).join("\n").trim()
    if (q && a) qas.push({ q, a })
  }
  return qas
}

function extractSlug(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/^the best\s+/, "")
      .replace(/\s+alternative.*$/, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") + "-alternatives"
  )
}

async function injectFile(file: string) {
  const raw = readFileSync(`${BLOG_DIR}/${file}`, "utf8")
  const { title, description, author, image, date, tags, keywords, body } =
    parseFrontmatter(raw)
  const faqs = extractFaq(body)

  const wordCount = body.split(/\s+/).length
  const readingMinutes = Math.max(1, Math.round(wordCount / 220))
  const slug = extractSlug(title)
  const publishedAt = date ? new Date(date) : new Date()

  await db.delete(posts).where(eq(posts.slug, slug))
  const [inserted] = await db
    .insert(posts)
    .values({
      id: nanoid(),
      slug,
      title,
      description,
      content: body,
      coverImage: image,
      coverAlt: image ? `${title}` : null,
      author,
      tags: keywords.length ? keywords : tags,
      faq: faqs.length ? faqs : null,
      readingMinutes,
      publishedAt,
    })
    .returning({ id: posts.id })

  console.log(
    `[inject] ${file} → slug=${slug} words=${wordCount} mins=${readingMinutes} faqs=${faqs.length}`
  )
  return inserted!.id
}

async function main() {
  for (const file of FILES) {
    await injectFile(file)
  }
  console.log(`[inject] all ${FILES.length} posts inserted`)
  process.exit(0)
}

main().catch((err) => {
  console.error("[inject] failed:", err)
  process.exit(1)
})
