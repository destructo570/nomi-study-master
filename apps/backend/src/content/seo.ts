/**
 * Pure SEO helpers — slug, reading-time, Schema.org builder, internal-link
 * graph. Pull product facts from the knowledge base (single source of truth).
 * Pure functions only; fully unit-testable.
 */
import { loadKnowledge } from "./knowledge/loader"
import type { ContentType, GeneratedContent, InternalLink } from "./schemas"
import { getTemplate } from "./engine/templates"

/* ------------------------------------------------------------------ */
/* Slug + reading time                                                  */
/* ------------------------------------------------------------------ */

const SLUG_STOP = new Set(["a","an","the","and","or","but","of","to","in","on","for","with","is","are"])

export function slugify(input: string): string {
  const ws = input.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean).filter((w) => !SLUG_STOP.has(w)).slice(0, 8)
  return (ws.join("-").replace(/-+/g, "-").replace(/^-+|-+$/g, "") || "page")
}

export function estimateReadingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}

/* ------------------------------------------------------------------ */
/* Schema.org                                                           */
/* ------------------------------------------------------------------ */

/** Default Schema.org object for a page given its content type + content. */
export function buildSchemaOrg(type: ContentType, content: GeneratedContent, siteUrl = "https://nomi.com"): Record<string, unknown> {
  const k = loadKnowledge()
  const url = `${siteUrl}/${content.seo.slug}`
  const base = {
    "@context": "https://schema.org",
    "@type": getTemplate(type).schemaType,
    headline: content.seo.h1,
    description: content.seo.metaDescription,
    url,
    isPartOf: { "@type": "WebSite", name: k.product.name, url: siteUrl },
    publisher: { "@type": "Organization", name: k.product.name, url: siteUrl },
  }
  switch (type) {
    case "faq":
      return { ...base, "@type": "FAQPage", mainEntity: content.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }
    case "tutorial":
      return { ...base, "@type": "HowTo", name: content.seo.h1, step: content.sections.filter((s) => s.heading.startsWith("Step")).map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.heading, text: s.body })) }
    case "feature":
    case "landing":
      return { ...base, applicationCategory: "EducationApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }
    default:
      return base
  }
}

/* ------------------------------------------------------------------ */
/* Internal-link graph                                                  */
/* ------------------------------------------------------------------ */

/** Suggest related internal links deterministically — no model call. */
export function suggestInternalLinks(content: GeneratedContent, opts: { knownSlugs?: string[]; max?: number } = {}): InternalLink[] {
  const max = opts.max ?? 6
  const k = loadKnowledge()
  const known = new Set([...k.capabilities.features.map((f) => f.slug), ...(opts.knownSlugs ?? [])])

  const body = [content.seo.h1, content.seo.metaDescription, ...content.sections.map((s) => `${s.heading} ${s.body}`), ...content.faq.map((f) => `${f.q} ${f.a}`)].join(" ").toLowerCase()
  const scored: { link: InternalLink; score: number }[] = []
  for (const f of k.capabilities.features) {
    if (!known.has(f.slug)) continue
    const selfSlugStem = content.seo.slug.split("-")[0] ?? ""
    if (f.slug.includes(selfSlugStem) && content.seo.slug === slugify(f.name)) continue
    const tokens = `${f.name} ${f.blurb}`.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 3)
    let score = 0
    for (const t of tokens) score += body.includes(t) ? 1 : 0
    if (score === 0) continue
    scored.push({ score: (opts.knownSlugs ?? []).includes(f.slug) ? score + 2 : score, link: { anchorText: f.name, targetSlug: f.slug, reason: `Relates to ${f.name.toLowerCase()} (${f.blurb})` } })
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, max).map((s) => s.link)
}

/** Resolve a feature id → slug link for cross-referencing. */
export function linkToFeature(featureId: string): string | null {
  const f = loadKnowledge().capabilities.features.find((x) => x.id === featureId)
  return f ? f.slug : null
}