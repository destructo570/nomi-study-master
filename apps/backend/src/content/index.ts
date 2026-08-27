/**
 * Public API of the Nomi content engine. Import from `./content` (this file);
 * never deep-import engine internals.
 */
export { runEngine, getJob, listJobs, scrubJob } from "./engine/orchestrator"
export { defaultCtx } from "./engine/context"
export type { Ctx } from "./engine/context"

export { loadKnowledge, reloadKnowledge, featureById, internalSlugs } from "./knowledge/loader"
export type { Knowledge, Competitor, ProductKnowledge } from "./knowledge/loader"

export { getTemplate, templates, sectionBriefsFor, expectedHeadingsFilled } from "./engine/templates"
export type { Template } from "./engine/templates"

export { validateContent, validateWith, ruleIds } from "./validators"
export { scoreContent } from "./scoring"
export { buildSchemaOrg, suggestInternalLinks, slugify, estimateReadingMinutes } from "./seo"
export { toMarkdown, toDraftMarkdown } from "./markdown"
export { toMdx, toDraftMdx, toJson, toFrontmatter, toMetadata, toExportBundle } from "./exporters"
export { persistResult, upsertResult, persistJobStatus } from "./persist"
export { model, setModelFactory, VARIATION_PRESETS, MODEL_ID, MAX_TOKENS_CONTENT } from "./config"

export type {
  ContentType, SearchIntent, FunnelStage,
  Section, FaqItem, Cta, ImageIdea, InternalLink, ExternalReference, SchemaOrg,
  SeoBlock, ResearchObject, ContentBrief, Outline, OutlineSection,
  GeneratedContent, Finding, SubScores, ScoreReport, ValidationResult,
  JobStage, JobStatus, StageState, GenerationResult, GenerateRequest, GenerateRequestInput,
} from "./schemas"