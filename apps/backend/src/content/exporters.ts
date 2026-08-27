/**
 * Exporters — turn a `GeneratedContent` into the formats the web consumes.
 *
 * `toMdx`: frontmatter + body in Nomi's MDX-friendly Markdown (matches the
 * existing `posts.content` and `seo_pages.content` rendering). The web
 * already renders Markdown server-side via marked/react-markdown.
 * `toJson`, `toFrontmatter`, `toMetadata`: structural exports for a CMS.
 */
import { toMarkdown, toDraftMarkdown } from "./markdown"

export function toMdx(content: import("./schemas").GeneratedContent, siteUrl = "https://nomi.com"): string {
  return toMarkdown(content, siteUrl)
}

export function toDraftMdx(content: import("./schemas").GeneratedContent): string {
  return toDraftMarkdown(content)
}

export function toJson(content: import("./schemas").GeneratedContent): Record<string, unknown> {
  return JSON.parse(JSON.stringify(content))
}

export function toFrontmatter(content: import("./schemas").GeneratedContent): Record<string, unknown> {
  return {
    title: content.seo.title,
    description: content.seo.metaDescription,
    slug: content.seo.slug,
    tags: content.seo.relatedKeywords,
    readingMinutes: content.seo.readingMinutes,
    published: false,
  }
}

export function toMetadata(content: import("./schemas").GeneratedContent) {
  return {
    title: content.seo.title,
    description: content.seo.metaDescription,
    slug: content.seo.slug,
    keywords: [...content.seo.relatedKeywords, ...content.seo.semanticKeywords],
    readingMinutes: content.seo.readingMinutes,
    h1: content.seo.h1,
    internalLinks: content.internalLinks,
    externalReferences: content.externalReferences,
    imageIdeas: content.imageIdeas,
    schema: content.schema,
    tags: content.seo.relatedKeywords,
  }
}

/** Full export bundle the admin "Export" button returns. */
export function toExportBundle(content: import("./schemas").GeneratedContent) {
  return {
    mdx: toMdx(content),
    json: toJson(content),
    frontmatter: toFrontmatter(content),
    metadata: toMetadata(content),
  }
}