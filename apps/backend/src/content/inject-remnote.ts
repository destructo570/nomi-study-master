/// One-off: inject remnote-alternatives.md into the posts table.
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"

import { db } from "@workspace/db"
import { posts } from "@workspace/db/schema"

const FILE = resolve(
  import.meta.dir,
  "../../../web/app/blog/remnote-alternatives.md"
)

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

async function main() {
  const raw = readFileSync(FILE, "utf8")
  const { title, description, author, image, date, tags, keywords, body } =
    parseFrontmatter(raw)
  const faqs = extractFaq(body)

  const wordCount = body.split(/\s+/).length
  const readingMinutes = Math.max(1, Math.round(wordCount / 220))
  const slug = "remnote-alternatives"
  const publishedAt = date ? new Date(date) : new Date()

  // upsert: delete existing slug then insert
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
      coverAlt: image ? "RemNote alternatives compared to Nomi" : null,
      author,
      tags: keywords.length ? keywords : tags,
      faq: faqs.length ? faqs : null,
      readingMinutes,
      publishedAt,
    })
    .returning({ id: posts.id })

  console.log(`[inject] inserted post ${inserted!.id} slug=${slug}`)
  console.log(
    `[inject] words=${wordCount} readingMinutes=${readingMinutes} faqs=${faqs.length} publishedAt=${publishedAt.toISOString()}`
  )
  process.exit(0)
}

main().catch((err) => {
  console.error("[inject] failed:", err)
  process.exit(1)
})
