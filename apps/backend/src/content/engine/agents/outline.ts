/**
 * Brief + Outline Agents.
 *
 * Brief Agent turns research into a typed `ContentBrief` (the writer's spec).
 * Outline Agent turns the brief + template into a section-level `Outline`,
 * which the writer fills one section at a time. Keeping them as separate
 * agents means a human can edit the outline in the admin UI and re-run only
 * the writer.
 */
import { generateObject } from "ai"

import type { Ctx } from "../context"
import { briefBlock, productBlock, researchBlock, systemBlock, templateBlock } from "../prompts"
import { slugify } from "../../seo"
import { getTemplate } from "../templates"
import type { ContentBrief, ContentType, Outline, ResearchObject } from "../../schemas"
import { contentBriefSchema, outlineSchema } from "../../schemas"

export async function briefAgent(args: {
  ctx: Ctx
  type: ContentType
  topic: string
  research: ResearchObject
  tone?: string
  readingLevel?: string
  targetWordCount?: number
  cta?: { text: string; href: string }
  customInstructions?: string
}): Promise<ContentBrief> {
  const { ctx } = args
  const tpl = getTemplate(args.type)
  const ctaDefaultText = (tpl && ctx.knowledge.ctas.byType[args.type]?.text
      ? ctx.knowledge.ctas.byType[args.type]!.text.replace("{topic}", args.topic)
      : ctx.knowledge.ctas.primary.text) as string
  const cta = args.cta ?? { text: ctaDefaultText, href: ctx.knowledge.ctas.primary.href }
  const words = args.targetWordCount ?? tpl?.recommendedWordCount ?? 800

  const system = [systemBlock(), productBlock(ctx)].join("\n\n")
  const userPrompt = [
    `## TASK: produce a content brief for a ${tpl?.label} about "${args.topic}".`,
    researchBlock(args.research),
    "",
    `Defaults: tone=${args.tone ?? "helpful, professional, friendly"}, readingLevel=${args.readingLevel ?? "plain English, Flesch 55-70"}, estimatedWords=${words}.`,
    args.customInstructions ? `Custom instructions: ${args.customInstructions}` : "",
    "",
    "Fill the brief schema. outlineIds should be the section ids you'll produce in the outline next (from the template outline). CTA must be specific and honest. Return ONLY the JSON object.",
  ].filter(Boolean).join("\n")

  const { object } = await generateObject({
    model: ctx.model,
    schema: contentBriefSchema,
    schemaName: "NomiContentBrief",
    system,
    prompt: userPrompt,
    temperature: 0.3,
    maxOutputTokens: 1200,
  })
  return { ...object, cta, topic: args.topic, type: args.type }
}

export async function outlineAgent(args: {
  ctx: Ctx
  brief: ContentBrief
}): Promise<Outline> {
  const { ctx } = args
  const tpl = getTemplate(args.brief.type)
  const base = tpl.sections.map((s) => ({ ...s }))

  const system = [systemBlock(), productBlock(ctx), briefBlock(args.brief), templateBlock(args.brief.type, args.brief.topic)].join("\n\n")
  const userPrompt = [
    "## TASK: produce the article outline. Start from the template sections below — you may add or reorder optional sections, but every required section must survive, with the same ids.",
    "",
    "Template sections (id | heading | words):",
    ...base.map((s) => `- ${s.id} | ${s.heading.replace("{topic}", args.brief.topic)} | ${s.words}w ${s.required ? "(required)" : "(optional)"}`),
    "",
    "slug must be lowercase, hyphenated, no spaces. h1 distinct from a typical title. faqCount must be ≥ the template minimum. Return ONLY the JSON object.",
  ].join("\n")

  const { object } = await generateObject({
    model: ctx.model,
    schema: outlineSchema,
    schemaName: "NomiOutline",
    system,
    prompt: userPrompt,
    temperature: 0.3,
    maxOutputTokens: 1500,
  })

  return { ...object, slug: object.slug && /^[a-z0-9-]+$/.test(object.slug) ? object.slug : slugify(args.brief.topic) }
}