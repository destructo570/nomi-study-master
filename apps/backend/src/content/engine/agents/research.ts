/**
 * Research Agent — produces a structured `ResearchObject` consumed by the
 * rest of the pipeline. If the caller already supplied research (optional
 * pipeline input), this agent is skipped.
 *
 * No live web research yet (see README future). When keyword research data
 * is provided via the research layer, this agent enriches it with entities,
 * semantic keywords, people-also-ask, relevant Nomi feature ids, and (for
 * comparison/alternative types) the competitor profile. The enrichment is
 * a model call so the brief agent gets a focused, structured object instead
 * of raw prose.
 */
import { generateObject } from "ai"
import { z } from "zod"

import type { Ctx } from "../context"
import { productBlock, systemBlock } from "../prompts"
import type { ContentType, ResearchObject } from "../../schemas"
import { researchSchema } from "../../schemas"

const researchOutputSchema = researchSchema

export async function researchAgent(args: {
  ctx: Ctx
  type: ContentType
  topic: string
  primaryKeyword: string
  secondaryKeywords?: string[]
  competitorId?: string | null
}): Promise<ResearchObject> {
  const { ctx } = args
  const k = ctx.knowledge

  const system = [systemBlock(), productBlock(ctx)].join("\n\n")
  const userPrompt = [
    `## TASK: produce a structured research object for a ${args.type} page about "${args.topic}".`,
    `Primary keyword: ${args.primaryKeyword}`,
    args.secondaryKeywords?.length ? `Secondary keywords: ${args.secondaryKeywords.join(", ")}` : "",
    "",
    "Fill every field of the schema. Derive entities, semantic keywords, and people-also-ask from the topic and the primary keyword. Match productFeatureIds to real feature ids from the product context. Do not invent features or cite fake URLs — externalReferences/citations must be real, authoritative sites (Wikipedia, official docs); if unsure, leave empty.",
    args.competitorId ? `comparisonData should summarise the competitor profile for "${args.competitorId}" already provided in the context.` : "",
    "",
    "Available Nomi feature ids (only use these): " + k.capabilities.features.map((f) => f.id).join(", "),
    "",
    "Return ONLY the JSON object.",
  ].filter(Boolean).join("\n")

  const { object } = await generateObject({
    model: ctx.model,
    schema: researchOutputSchema,
    schemaName: "NomiResearchObject",
    system,
    prompt: userPrompt,
    temperature: 0.2,
    maxOutputTokens: 1500,
  })
  return { ...object, competitorId: args.competitorId ?? object.competitorId }
}

/** Merge caller-supplied research into a baseline (ensures every field set). */
export function normalizeResearch(input: Partial<ResearchObject>): ResearchObject {
  const zd = researchSchema.parse(input)
  void z
  return zd
}