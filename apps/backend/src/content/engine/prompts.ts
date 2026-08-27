/**
 * Prompt composition. Prompts are modular — never one giant prompt. Each
 * builder is a pure function returning a string block; agents compose the
 * ones they need. Product facts come ONLY from the knowledge base.
 *
 * Base text files live in apps/backend/prompts/content/ and are loaded via
 * the existing `loadContentPrompt` (kept here, isolated from product-feature
 * prompts).
 */
import { readFileSync } from "node:fs"
import path from "node:path"

import type { Ctx } from "./context"
import type {
  ContentBrief,
  Outline,
  OutlineSection,
  ResearchObject,
  ContentType,
} from "../schemas"
import { getTemplate, sectionBriefsFor } from "./templates"

const PROMPTS_DIR = path.resolve(import.meta.dir, "../../../prompts/content")
const fileCache = new Map<string, string>()

function read(name: string): string {
  let raw = fileCache.get(name)
  if (raw === undefined) {
    raw = readFileSync(path.join(PROMPTS_DIR, `${name}.txt`), "utf8").trimEnd()
    fileCache.set(name, raw)
  }
  return raw
}

/* ------------------------------------------------------------------ */
/* Block builders (pure)                                               */
/* ------------------------------------------------------------------ */

export function systemBlock(): string {
  return read("system")
}

export function seoBlock(): string {
  return read("seo")
}

export function productBlock(ctx: Ctx): string {
  const k = ctx.knowledge
  const features = k.capabilities.features
    .map((f) => `- ${f.name} (${f.slug}): ${f.blurb}`)
    .join("\n")
  return [
    `## PRODUCT: ${k.product.name} (${k.product.domain})`,
    k.product.pitch,
    "",
    `Audience: ${k.product.audience.join(", ")}.`,
    `Positioning: ${k.product.positioning}`,
    "",
    "Voice rules — follow exactly:",
    ...k.messaging.rules.map((r) => `- ${r}`),
    "",
    "Forbidden phrases (never use): " + k.messaging.forbiddenPhrases.join(", "),
    "Filler phrases (avoid): " + k.messaging.fillerPhrases.join(", "),
    "",
    "Real capabilities (only ever reference these — never invent features):",
    features,
    "",
    "Known limitations (be honest about these, never hide them):",
    ...k.limitations.limitations.map((l) => `- ${l}`),
    "",
    "Unsupported claims (never make these):",
    ...k.limitations.unsupportedClaims.map((l) => `- ${l}`),
    "",
    `Default primary CTA: "${k.ctas.primary.text}" → ${k.ctas.primary.href}`,
    "",
    "Capitalization: " + k.brandRules.capitalization,
  ].join("\n")
}

export function competitorBlock(ctx: Ctx, competitorId: string | null): string {
  if (!competitorId) return ""
  const c = ctx.knowledge.competitors[competitorId]
  if (!c) return ""
  return [
    `## COMPETITOR: ${c.name} (${c.url})`,
    c.positioning,
    "",
    `- Audience: ${c.audience}`,
    `- Core features: ${c.coreFeatures.join(", ")}`,
    `- Strengths (acknowledge honestly): ${c.strengths.join("; ")}`,
    `- Weaknesses: ${c.weaknesses.join("; ")}`,
    `- Recent AI features: ${c.recentAiFeatures}`,
    `- Integrations: ${c.integrations.join(", ")}`,
    `- Pricing note: ${c.pricingNote}`,
    `- Common praise: ${c.commonPraise}`,
    `- Common complaints: ${c.commonComplaints}`,
    `- Positioning vs Nomi: ${c.positioningVsNomi}`,
    "",
    `Official docs: ${c.documentation}`,
    `Pricing page: ${c.pricingPage}`,
    "",
    "EEAT: never invent prices or features; say 'check the competitor's site' if you don't know. Always acknowledge its strengths.",
  ].join("\n")
}

export function researchBlock(r: ResearchObject): string {
  return [
    "## RESEARCH (structured — consume this; do not hallucinate new keywords)",
    `Primary keyword: ${r.primaryKeyword}`,
    r.secondaryKeywords.length ? `Secondary keywords: ${r.secondaryKeywords.join(", ")}` : "",
    `Search intent: ${r.searchIntent}`,
    `Funnel stage: ${r.funnelStage}`,
    `Audience: ${r.audience}`,
    r.entities.length ? `Entities: ${r.entities.join(", ")}` : "",
    r.semanticKeywords.length ? `Semantic keywords: ${r.semanticKeywords.join(", ")}` : "",
    r.peopleAlsoAsk.length ? `People also ask:\n- ${r.peopleAlsoAsk.join("\n- ")}` : "",
    r.productFeatureIds.length ? `Relevant Nomi feature ids: ${r.productFeatureIds.join(", ")}` : "",
    r.srpNotes ? `SERP notes: ${r.srpNotes}` : "",
    r.externalReferences.length
      ? `External references (real — citable as-is):\n${r.externalReferences.map((e) => `- ${e.label} — ${e.url}`).join("\n")}`
      : "",
  ].filter(Boolean).join("\n")
}

export function briefBlock(brief: ContentBrief): string {
  return [
    "## CONTENT BRIEF",
    `Type: ${getTemplate(brief.type).label}`,
    `Topic: ${brief.topic}`,
    `Primary keyword: ${brief.primaryKeyword}`,
    brief.secondaryKeywords.length ? `Secondary keywords: ${brief.secondaryKeywords.join(", ")}` : "",
    `Search intent: ${brief.searchIntent} · funnel: ${brief.funnelStage}`,
    `Audience: ${brief.targetAudience} · reading level: ${brief.readingLevel}`,
    `Tone: ${brief.tone}`,
    `Target word count: ${brief.estimatedWords}`,
    `CTA: "${brief.cta.text}" → ${brief.cta.href}`,
    brief.competitorId ? `Competitor for comparison: ${brief.competitorId}` : "",
    brief.customInstructions ? `Custom instructions: ${brief.customInstructions}` : "",
  ].filter(Boolean).join("\n")
}

export function templateBlock(type: ContentType, topic: string): string {
  const tpl = getTemplate(type)
  return [
    `## TEMPLATE: ${tpl.label}`,
    tpl.guidance,
    "",
    `Schema.org @type for this page: "${tpl.schemaType}".`,
    "",
    "## SECTION OUTLINE",
    sectionBriefsFor(type, topic),
    "",
    `Produce at least ${tpl.minFaqs} FAQ items.`,
  ].join("\n")
}

export function outlineBlock(outline: Outline): string {
  return [
    "## OUTLINE (the writer fills exactly these sections — keep headings)",
    ...outline.sections.map((s, i) => `${i + 1}. ${s.heading} (~${s.words}w): ${s.brief}`),
  ].join("\n")
}

export function outlineSectionBlock(section: OutlineSection, index: number, total: number): string {
  return [
    `You are writing section ${index} of ${total}: "${section.heading}".`,
    `What to cover: ${section.brief}`,
    `Target ~${section.words} words.`,
    "Be plain, honest, and useful. Follow the product voice rules exactly. Do not invent features. Do not write other sections — only this one.",
    "Return ONLY the JSON object the schema requires.",
  ].join("\n")
}