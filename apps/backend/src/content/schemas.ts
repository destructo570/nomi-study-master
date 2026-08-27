/**
 * Schemas for the content engine — Zod source of truth, TS via z.infer.
 *
 * One document shape (`contentSchema`) still serves every content type; new
 * in v2 are the prerequisite objects the agents emit before a document is
 * written — `researchSchema` (Research Agent), `contentBriefSchema`
 * (Brief/Outline Agent), `outlineSchema` (Outline Agent). The pipeline
 * produces each in turn and every later stage consumes the prior object
 * plus the knowledge base — never raw prose.
 *
 * Content types expanded to include `doc`, `usecase`, `programmatic`.
 */
import { z } from "zod"

/* ------------------------------------------------------------------ */
/* Content types                                                       */
/* ------------------------------------------------------------------ */

export const CONTENT_TYPES = [
  "feature", "blog", "alternative", "comparison", "tutorial",
  "faq", "landing", "doc", "usecase", "programmatic",
] as const
export type ContentType = (typeof CONTENT_TYPES)[number]

export const SEARCH_INTENTS = ["informational", "commercial", "transactional", "navigational"] as const
export type SearchIntent = (typeof SEARCH_INTENTS)[number]

export const FUNNEL_STAGES = ["awareness", "consideration", "decision"] as const
export type FunnelStage = (typeof FUNNEL_STAGES)[number]

/* ------------------------------------------------------------------ */
/* Building blocks                                                      */
/* ------------------------------------------------------------------ */

export const sectionSchema = z.object({
  level: z.number().int().min(2).max(3).default(2),
  heading: z.string().min(1),
  body: z.string().min(1),
})
export type Section = z.infer<typeof sectionSchema>

export const faqItemSchema = z.object({ q: z.string().min(8), a: z.string().min(20) })
export type FaqItem = z.infer<typeof faqItemSchema>

export const ctaSchema = z.object({ text: z.string().min(8), href: z.string().min(1) })
export type Cta = z.infer<typeof ctaSchema>

export const imageIdeaSchema = z.object({
  kind: z.string(),
  placement: z.string(),
  description: z.string().min(10),
  altText: z.string().min(5),
})
export type ImageIdea = z.infer<typeof imageIdeaSchema>

export const internalLinkSchema = z.object({
  anchorText: z.string().min(3),
  targetSlug: z.string().min(1),
  reason: z.string().min(5),
})
export type InternalLink = z.infer<typeof internalLinkSchema>

export const externalReferenceSchema = z.object({
  label: z.string().min(3),
  url: z.string(),
  authority: z.string().optional(),
})
export type ExternalReference = z.infer<typeof externalReferenceSchema>

export const schemaOrgSchema = z.object({ "@type": z.string().min(1) }).passthrough().optional()
export type SchemaOrg = z.infer<typeof schemaOrgSchema>

/* ------------------------------------------------------------------ */
/* SEO block                                                            */
/* ------------------------------------------------------------------ */

export const seoBlockSchema = z.object({
  title: z.string().min(10).max(70),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  metaDescription: z.string().min(50).max(160),
  h1: z.string().min(5).max(90),
  relatedKeywords: z.array(z.string()).default([]),
  semanticKeywords: z.array(z.string()).default([]),
  targetAudience: z.string().min(3),
  searchIntent: z.string().min(2),
  readingMinutes: z.number().int().min(1).max(30),
})
export type SeoBlock = z.infer<typeof seoBlockSchema>

/* ------------------------------------------------------------------ */
/* Research object (Research Agent)                                    */
/* ------------------------------------------------------------------ */

export const researchSchema = z.object({
  primaryKeyword: z.string().min(1),
  secondaryKeywords: z.array(z.string()).default([]),
  searchIntent: z.enum(SEARCH_INTENTS).default("informational"),
  funnelStage: z.enum(FUNNEL_STAGES).default("awareness"),
  audience: z.string().default(""),
  competitorId: z.string().nullable().default(null),
  entities: z.array(z.string()).default([]),
  semanticKeywords: z.array(z.string()).default([]),
  peopleAlsoAsk: z.array(z.string()).default([]),
  internalLinkCandidates: z.array(z.string()).default([]),
  externalReferences: z.array(externalReferenceSchema).default([]),
  citations: z.array(externalReferenceSchema).default([]),
  productFeatureIds: z.array(z.string()).default([]),
  comparisonData: z.record(z.string(), z.unknown()).default({}),
  srpNotes: z.string().default(""),
})
export type ResearchObject = z.infer<typeof researchSchema>

/* ------------------------------------------------------------------ */
/* Content brief (Brief Agent)                                         */
/* ------------------------------------------------------------------ */

export const contentBriefSchema = z.object({
  topic: z.string().min(2),
  type: z.enum(CONTENT_TYPES),
  primaryKeyword: z.string().min(1),
  secondaryKeywords: z.array(z.string()).default([]),
  searchIntent: z.enum(SEARCH_INTENTS),
  funnelStage: z.enum(FUNNEL_STAGES),
  targetAudience: z.string(),
  readingLevel: z.string().default("plain English, Flesch 55-70"),
  estimatedWords: z.number().int().min(200).max(3000),
  tone: z.string().default("helpful, professional, friendly"),
  cta: ctaSchema,
  productFeatureIds: z.array(z.string()).default([]),
  competitorId: z.string().nullable().default(null),
  customInstructions: z.string().default(""),
  outlineIds: z.array(z.string()).min(2),
})
export type ContentBrief = z.infer<typeof contentBriefSchema>

/* ------------------------------------------------------------------ */
/* Outline (Outline Agent)                                             */
/* ------------------------------------------------------------------ */

export const outlineSectionSchema = z.object({
  id: z.string(),
  heading: z.string().min(1),
  brief: z.string().min(5),
  words: z.number().int().min(40),
  /** Required vs. optional per template. */
  required: z.boolean().default(true),
})
export type OutlineSection = z.infer<typeof outlineSectionSchema>

export const outlineSchema = z.object({
  type: z.enum(CONTENT_TYPES),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  h1: z.string().min(5),
  sections: z.array(outlineSectionSchema).min(2),
  faqCount: z.number().int().min(3),
}).passthrough()
export type Outline = z.infer<typeof outlineSchema>

/* ------------------------------------------------------------------ */
/* The generated document                                               */
/* ------------------------------------------------------------------ */

export const contentSchema = z.object({
  type: z.enum(CONTENT_TYPES),
  seo: seoBlockSchema,
  sections: z.array(sectionSchema).min(2),
  faq: z.array(faqItemSchema).min(3),
  cta: ctaSchema,
  internalLinks: z.array(internalLinkSchema).max(8).default([]),
  externalReferences: z.array(externalReferenceSchema).max(6).default([]),
  imageIdeas: z.array(imageIdeaSchema).max(6).default([]),
  schema: schemaOrgSchema,
})
export type GeneratedContent = z.infer<typeof contentSchema>

/* ------------------------------------------------------------------ */
/* Validation + scoring                                                 */
/* ------------------------------------------------------------------ */

export const findingSchema = z.object({
  rule: z.string(),
  severity: z.enum(["info", "warn", "error", "block"]),
  message: z.string(),
  context: z.string().optional(),
})
export type Finding = z.infer<typeof findingSchema>

export const subScoresSchema = z.object({
  seo: z.number().min(0).max(100),
  readability: z.number().min(0).max(100),
  naturalness: z.number().min(0).max(100),
  productAccuracy: z.number().min(0).max(100),
  grammar: z.number().min(0).max(100),
  ctaQuality: z.number().min(0).max(100),
  eeat: z.number().min(0).max(100),
  internalLinking: z.number().min(0).max(100),
})
export type SubScores = z.infer<typeof subScoresSchema>

export const scoreReportSchema = subScoresSchema.extend({
  overall: z.number().min(0).max(100),
  /** One human sentence per subscore explaining the score. */
  explanations: z.record(z.string(), z.string()).default({}),
  notes: z.array(z.string()).default([]),
})
export type ScoreReport = z.infer<typeof scoreReportSchema>

export const validationResultSchema = z.object({
  findings: z.array(findingSchema).default([]),
  passed: z.boolean(),
  blockingCount: z.number().int().min(0),
})
export type ValidationResult = z.infer<typeof validationResultSchema>

/* ------------------------------------------------------------------ */
/* Job (pipeline run record)                                           */
/* ------------------------------------------------------------------ */

export const JOB_STAGES = [
  "research", "outline", "writing", "seo", "fact-check",
  "grammar", "scoring", "schema", "links", "export",
] as const
export type JobStage = (typeof JOB_STAGES)[number]

export const stageStateSchema = z.object({
  status: z.enum(["pending", "running", "done", "failed", "skipped"]).default("pending"),
  startedAt: z.string().nullable().default(null),
  finishedAt: z.string().nullable().default(null),
  /** Short human log lines for the generation screen. */
  logs: z.array(z.string()).default([]),
  /** If failed, the error. */
  error: z.string().nullable().default(null),
})
export type StageState = z.infer<typeof stageStateSchema>

export const jobStatusSchema = z.object({
  id: z.string(),
  type: z.enum(CONTENT_TYPES),
  topic: z.string(),
  status: z.enum(["queued", "running", "done", "failed"]),
  stages: z.record(z.string(), stageStateSchema).default({}),
  /** Progress 0-100 for the generation screen bar. */
  progress: z.number().min(0).max(100).default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
  resultId: z.string().nullable().default(null),
  score: z.number().nullable().default(null),
})
export type JobStatus = z.infer<typeof jobStatusSchema>

/* ------------------------------------------------------------------ */
/* Generation result                                                    */
/* ------------------------------------------------------------------ */

export const generationResultSchema = z.object({
  json: contentSchema,
  markdown: z.string(),
  research: researchSchema.optional(),
  brief: contentBriefSchema.optional(),
  outline: outlineSchema.optional(),
  validation: validationResultSchema,
  score: scoreReportSchema,
  meta: z.object({
    model: z.string(),
    generatedAt: z.string(),
    keyword: z.string(),
    contentType: z.enum(CONTENT_TYPES),
    jobId: z.string().optional(),
    durationMs: z.number(),
  }).optional(),
})
export type GenerationResult = z.infer<typeof generationResultSchema>

/* ------------------------------------------------------------------ */
/* Request                                                              */
/* ------------------------------------------------------------------ */

export const generateRequestSchema = z.object({
  type: z.enum(CONTENT_TYPES),
  topic: z.string().min(2).max(120),
  angle: z.string().optional(),
  /** Pre-supplied research. If present, the Research Agent is skipped. */
  research: researchSchema.optional(),
  /** Which optional stages to run. Defaults all true. */
  enable: z.object({
    research: z.boolean(),
    seo: z.boolean(),
    factCheck: z.boolean(),
    grammar: z.boolean(),
    internalLinks: z.boolean(),
    schema: z.boolean(),
    imageSuggestions: z.boolean(),
    competitorResearch: z.boolean(),
    selfReview: z.boolean(),
  }).default({
    research: true, seo: true, factCheck: true, grammar: true,
    internalLinks: true, schema: true, imageSuggestions: true,
    competitorResearch: true, selfReview: true,
  }),
  variations: z.number().int().min(1).max(3).default(1),
  tone: z.string().default("helpful, professional, friendly"),
  readingLevel: z.string().default("plain English, Flesch 55-70"),
  language: z.string().default("en"),
  country: z.string().default("US"),
  targetWordCount: z.number().int().min(200).max(3000).default(900),
  cta: ctaSchema.optional(),
  customInstructions: z.string().default(""),
  competitorId: z.string().optional(),
  knownInternalSlugs: z.array(z.string()).default([]),
})
export type GenerateRequest = z.infer<typeof generateRequestSchema>
export type GenerateRequestInput = z.input<typeof generateRequestSchema>