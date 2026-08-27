/**
 * GeneratedContent → Markdown. The single renderer for every output format
 * the web needs. Reuse `marked` on the consumer side (web already does) or
 * store the markdown as-is in the `posts.content` / `seo_pages.content`
 * columns.
 */
import { loadKnowledge } from "./knowledge/loader"
import type { GeneratedContent } from "./schemas"

function join(xs: string[]): string {
  return xs.filter(Boolean).join("\n\n")
}

/** Serialize a generated document to a clean Markdown article. */
export function toMarkdown(content: GeneratedContent, siteUrl = "https://nomi.com"): string {
  const frontmatter = [
    "---",
    `title: ${JSON.stringify(content.seo.title)}`,
    `description: ${JSON.stringify(content.seo.metaDescription)}`,
    `slug: ${JSON.stringify(content.seo.slug)}`,
    `tags: [${content.seo.relatedKeywords.map((t) => JSON.stringify(t)).join(", ")}]`,
    `readingMinutes: ${content.seo.readingMinutes}`,
    "published: false",
    "---",
  ].join("\n")

  const sections = content.sections.map((s) => {
    const prefix = "#".repeat(s.level)
    return `${prefix} ${s.heading}\n\n${s.body.trim()}`
  })

  const faqs = content.faq.length
    ? [
        "## Frequently asked questions",
        ...content.faq.map((f) => `**${f.q}**\n\n${f.a}`),
      ]
    : []

  const cta = [
    "## Start studying with Nomi",
    `[${content.cta.text} →](${content.cta.href.startsWith("/") ? siteUrl + content.cta.href : content.cta.href})`,
  ]

  const internal = content.internalLinks.length
    ? [
        "<!-- internal links -->",
        `Suggested internal links: ${content.internalLinks
          .map((l) => `[${l.anchorText}](${l.targetSlug})`)
          .join(" · ")}`,
      ]
    : []

  const schema =
    content.schema != null
      ? ["<!-- schema.org -->", "```json", JSON.stringify(content.schema, null, 2), "```"]
      : []

  return join([
    frontmatter,
    `# ${content.seo.h1}`,
    ...sections,
    ...faqs,
    ...cta,
    ...internal,
    ...schema,
  ])
}

/**
 * A compact "draft" markdown variant (no frontmatter/schema comments) for
 * quick previews, the admin route's response body, or pasting into a CMS
 * rich-text field that strips comments.
 */
export function toDraftMarkdown(content: GeneratedContent): string {
  const sections = content.sections.map((s) => `${"#".repeat(s.level)} ${s.heading}\n\n${s.body.trim()}`)
  const faqs = content.faq.map((f) => `### ${f.q}\n\n${f.a}`)
  return join([
    `# ${content.seo.h1}`,
    ...sections,
    "## Frequently asked questions",
    ...faqs,
    `\n[${content.cta.text}](${loadKnowledge().ctas.primary.href})`,
  ])
}