/**
 * Writer Agent — writes ONE section at a time, per the spec
 * ("Do NOT generate long articles in one prompt"). Each section gets its own
 * `generateObject` call with the full context (so it stays on-brand) but a
 * narrow output schema (one section), which raises per-section quality and
 * keeps every section strictly on-topic.
 *
 * After all sections, `mergeSections` assembles the full `GeneratedContent`,
 * running the FAQ + CTA + SEO blocks as small dedicated calls.
 */
import { generateObject } from "ai"
import { z } from "zod"

import type { Ctx } from "../context"
import {
  briefBlock, outlineBlock, outlineSectionBlock,
  productBlock, systemBlock, researchBlock, competitorBlock,
} from "../prompts"
import type {
  Cta, ContentBrief, FaqItem, GeneratedContent,
  Outline, ResearchObject, SeoBlock, Section,
} from "../../schemas"
import {
  ctaSchema, faqItemSchema, imageIdeaSchema,
  internalLinkSchema, seoBlockSchema, sectionSchema,
} from "../../schemas"
import { buildSchemaOrg, estimateReadingMinutes, slugify } from "../../seo"

/* ---- per-section output schema (narrow) ----------------------------- */

const oneSectionSchema = sectionSchema

export async function writeSection(args: {
  ctx: Ctx
  brief: ContentBrief
  outline: Outline
  research: ResearchObject
  sectionIndex: number
  total: number
  /** The outline section to write. */
  section: Outline["sections"][number]
}): Promise<Section> {
  const { ctx } = args
  const system = [
    systemBlock(), productBlock(ctx),
    researchBlock(args.research),
    args.brief.competitorId ? competitorBlock(ctx, args.brief.competitorId) : "",
    briefBlock(args.brief),
    outlineBlock(args.outline),
  ].filter(Boolean).join("\n\n")

  const prompt = outlineSectionBlock(args.section, args.sectionIndex + 1, args.total)

  const { object } = await generateObject({
    model: ctx.model,
    schema: oneSectionSchema,
    schemaName: "NomiSection",
    system,
    prompt,
    temperature: 0.5,
    maxOutputTokens: 900,
  })
  return object
}

/* ---- FAQ, CTA, SEO blocks ------------------------------------------ */

const faqsSchema = z.object({ faqs: z.array(faqItemSchema).min(3) })

export async function writeFaqs(args: {
  ctx: Ctx
  brief: ContentBrief
  outline: Outline
  research: ResearchObject
  sections: Section[]
}): Promise<FaqItem[]> {
  const { ctx } = args
  const system = [systemBlock(), productBlock(ctx), researchBlock(args.research), briefBlock(args.brief)].join("\n\n")
  const prompt = [
    "## TASK: produce the FAQ array for this page.",
    `Topic: ${args.brief.topic} · type: ${args.brief.type}.`,
    `Produce at least ${args.outline.faqCount} honest Q&As. Use the People Also Ask from research as seeds where relevant. Do not invent facts. Each answer ≥ 20 words, plain English.`,
    "Return ONLY { faqs: [...] }.",
  ].join("\n")

  const { object } = await generateObject({
    model: ctx.model, schema: faqsSchema, schemaName: "NomiFaqs",
    system, prompt, temperature: 0.4, maxOutputTokens: 1200,
  })
  return object.faqs
}

const ctaOutSchema = z.object({ cta: ctaSchema })

export async function writeCta(args: {
  ctx: Ctx
  brief: ContentBrief
}): Promise<Cta> {
  void args
  // ponytail: skip a model call — the brief's CTA is the source of truth;
  // validate only. CTAs shouldn't vary by section content.
  return ctaSchema.parse(args.brief.cta)
}

const seoOutSchema = z.object({ seo: seoBlockSchema })

export async function writeSeo(args: {
  ctx: Ctx
  brief: ContentBrief
  sections: Section[]
  faqs: FaqItem[]
}): Promise<SeoBlock> {
  const { ctx } = args
  const body = args.sections.map((s) => `${s.heading}. ${s.body}`).join(" ").slice(0, 4000)
  const system = [systemBlock(), productBlock(ctx), `## SEO FIELD RULES\n${readSeoRules()}`].join("\n\n")
  const prompt = [
    "## TASK: produce the SEO block for this page.",
    `Topic: ${args.brief.topic} · type: ${args.brief.type}.`,
    `Target word count: ${args.brief.estimatedWords} → current sections ~${args.sections.reduce((n, s) => n + s.body.split(/\s+/).length, 0)} words.`,
    `Reading minutes (honest): ${estimateReadingMinutes(body)}.`,
    "Body excerpt for context:",
    body,
    "",
    "Fill the seo schema. title 50-65, slug lowercase-hyphenated, metaDescription 120-158. h1 distinct from title. Return ONLY { seo: {...} }.",
  ].join("\n")

  const { object } = await generateObject({
    model: ctx.model, schema: seoOutSchema, schemaName: "NomiSeo",
    system, prompt, temperature: 0.3, maxOutputTokens: 800,
  })
  const seo = object.seo
  return { ...seo, slug: seo.slug && /^[a-z0-9-]+$/.test(seo.slug) ? seo.slug : slugify(args.brief.topic) }
}

function readSeoRules(): string {
  // reuse prompts/content/seo.txt
  // inlined to avoid a second loader import cycle
  return "title 50-65 chars; slug lowercase-hyphenated; metaDescription 120-158; h1 distinct from title; no keyword stuffing."
}

/* ---- merge --------------------------------------------------------- */

const linksOutSchema = z.object({ links: z.array(internalLinkSchema).max(8) })
const imagesOutSchema = z.object({ images: z.array(imageIdeaSchema).max(6) })

export async function mergeContent(args: {
  ctx: Ctx
  brief: ContentBrief
  outline: Outline
  sections: Section[]
  faqs: FaqItem[]
  cta: Cta
  seo: SeoBlock
  enable: { internalLinks: boolean; imageSuggestions: boolean; schema: boolean }
  knownSlugs: string[]
}): Promise<GeneratedContent> {
  const { ctx } = args
  const internalLinks = args.enable.internalLinks
    ? await suggestLinksCall(ctx, args.outline, args.sections, args.brief, args.knownSlugs)
    : []
  const imageIdeas = args.enable.imageSuggestions ? await suggestImagesCall(ctx, args.brief, args.sections) : []
  const docForSchema: GeneratedContent = {
    type: args.brief.type, seo: args.seo, sections: args.sections, faq: args.faqs, cta: args.cta,
    internalLinks, externalReferences: [], imageIdeas, schema: undefined,
  }
  const schemaRaw = args.enable.schema ? buildSchemaOrg(args.brief.type, docForSchema) : undefined
  void z
  const schema = schemaRaw as unknown as GeneratedContent["schema"]
  return { ...docForSchema, schema }
}

async function suggestLinksCall(ctx: Ctx, outline: Outline, sections: Section[], brief: ContentBrief, knownSlugs: string[]) {
  const system = [systemBlock(), productBlock(ctx)].join("\n\n")
  const prompt = [
    "## TASK: suggest contextual internal links for this page.",
    `Type: ${brief.type}. Topic: ${brief.topic}.`,
    "Choose 3-6 Nomi feature slugs from the product context that genuinely relate to this page's sections. Each link gets anchorText, targetSlug (exact slug from product context), reason. Do not invent slugs.",
    `Already-published slugs to prioritise: ${knownSlugs.join(", ")}`,
    "Return ONLY { links: [...] }.",
  ].join("\n")
  const { object } = await generateObject({
    model: ctx.model, schema: linksOutSchema, schemaName: "NomiLinks",
    system, prompt, temperature: 0.2, maxOutputTokens: 600,
  })
  void outline
  void sections
  // filter to known valid slugs (knowledge + knownSlugs) — defensive even though told not to invent
  const valid = new Set([...ctx.knowledge.capabilities.features.map((f) => f.slug), ...knownSlugs])
  return object.links.filter((l) => valid.has(l.targetSlug))
}

async function suggestImagesCall(ctx: Ctx, brief: ContentBrief, sections: Section[]) {
  const system = [systemBlock(), productBlock(ctx)].join("\n\n")
  const sectionList = sections.map((s) => `- ${s.heading}`).join("\n")
  const prompt = [
    "## TASK: suggest images (descriptions only — NEVER generate an image).",
    `Type: ${brief.type}. Topic: ${brief.topic}.`,
    "Sections:\n" + sectionList,
    "Suggest hero + 1-3 inline. kind (hero illustration / feature diagram / workflow graphic / infographic), placement, description (what to draw), altText. Return ONLY { images: [...] }.",
  ].join("\n")
  const { object } = await generateObject({
    model: ctx.model, schema: imagesOutSchema, schemaName: "NomiImages",
    system, prompt, temperature: 0.4, maxOutputTokens: 700,
  })
  return object.images
}