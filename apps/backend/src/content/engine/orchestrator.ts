/**
 * Engine orchestrator — the multi-stage pipeline:
 *   research → outline → writing (section-by-section) → merge →
 *   seo review → fact check → grammar → brand → content gap →
 *   validate → score → export
 *
 * Each stage updates a `JobStatus` (in-memory; persisted to DB by the route)
 * so the admin generation screen can poll progress. `step` returns the value
 * its callback produces so TypeScript tracks definite-assignment through the
 * async flow (sidestepping the closure-side-effect trap).
 */
import { nanoid } from "nanoid"

import type { Ctx } from "./context"
import { seoReview, grammarReviewAgent, contentGapAgentModel } from "./agents/review"
import { briefAgent, outlineAgent } from "./agents/outline"
import { researchAgent } from "./agents/research"
import { mergeContent, writeCta, writeFaqs, writeSection, writeSeo } from "./agents/writer"
import { validateWith } from "../validators"
import { scoreContent } from "../scoring"
import { toMdx } from "../exporters"
import type {
  Cta, ContentBrief, FaqItem, GeneratedContent,
  JobStage, JobStatus, Outline, ResearchObject, Section, SeoBlock,
} from "../schemas"
import { jobStatusSchema, researchSchema } from "../schemas"
import { MODEL_ID } from "../config"
import type { GenerateRequestInput } from "../schemas"
import type { GenerationResult, ScoreReport, ValidationResult } from "../schemas"

const STAGES: JobStage[] = ["research", "outline", "writing", "seo", "fact-check", "grammar", "scoring", "export"]

function newJob(req: { type: JobStatus["type"]; topic: string }): JobStatus {
  const now = new Date().toISOString()
  const stages: Record<string, JobStatus["stages"][string]> = {}
  for (const s of STAGES) stages[s] = { status: "pending", startedAt: null, finishedAt: null, logs: [], error: null }
  return { id: nanoid(), type: req.type, topic: req.topic, status: "queued", stages, progress: 0, createdAt: now, updatedAt: now, resultId: null, score: null }
}

const jobsMap: Map<string, JobStatus> = new Map()
export function getJob(id: string): JobStatus | undefined { return jobsMap.get(id) }
export function listJobs(limit = 50): JobStatus[] { return Array.from(jobsMap.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit) }

async function step<T>(job: JobStatus, stage: JobStage, fn: () => Promise<T>): Promise<T> {
  const s = job.stages[stage]!
  s.status = "running"
  s.startedAt = new Date().toISOString()
  job.updatedAt = new Date().toISOString()
  try {
    const value = await fn()
    s.status = "done"
    return value
  } catch (err) {
    s.status = "failed"
    s.error = err instanceof Error ? err.message : "unknown"
    throw err
  } finally {
    s.finishedAt = new Date().toISOString()
  }
}

export async function runEngine(req: GenerateRequestInput, ctx: Ctx): Promise<{ job: JobStatus; result: GenerationResult }> {
  const job = newJob({ type: req.type, topic: req.topic })
  job.status = "running"
  jobsMap.set(job.id, job)
  const start = Date.now()
  const log = (stage: string, line: string) => { job.stages[stage]?.logs.push(line); ctx.log(stage, line) }

  try {
    const research = await step<ResearchObject>(job, "research", async () => {
      if (req.research) { log("research", "Using caller-supplied research"); return researchSchema.parse(req.research) }
      log("research", `Researching "${req.topic}"…`)
      const r = await researchAgent({ ctx, type: req.type, topic: req.topic, primaryKeyword: req.topic, competitorId: req.competitorId })
      log("research", `Got research object with ${r.productFeatureIds.length} feature ids`)
      return r
    })

    const { brief, outline } = await step(job, "outline", async () => {
      log("outline", "Building brief…")
      const b = await briefAgent({ ctx, type: req.type, topic: req.topic, research, tone: req.tone, readingLevel: req.readingLevel, targetWordCount: req.targetWordCount, cta: req.cta, customInstructions: req.customInstructions })
      log("outline", "Building outline…")
      const o = await outlineAgent({ ctx, brief: b })
      log("outline", `Outline: ${o.sections.length} sections, slug "${o.slug}"`)
      return { brief: b, outline: o }
    })

    const content = await step(job, "writing", async () => {
      log("writing", `Writing ${outline.sections.length} sections one at a time…`)
      const sections: Section[] = []
      for (let i = 0; i < outline.sections.length; i++) {
        const s = outline.sections[i]!
        if (s.id === "faq") continue
        log("writing", `  section ${i + 1}/${outline.sections.length}: ${s.heading}`)
        sections.push(await writeSection({ ctx, brief, outline, research, sectionIndex: i, total: outline.sections.length, section: s }))
      }
      log("writing", "Writing FAQs…")
      const faqs: FaqItem[] = await writeFaqs({ ctx, brief, outline, research, sections })
      log("writing", "Writing CTA + SEO…")
      const cta: Cta = await writeCta({ ctx, brief })
      const seo: SeoBlock = await writeSeo({ ctx, brief, sections, faqs })
      log("writing", "Merging into document…")
      const doc = await mergeContent({
        ctx, brief, outline, sections, faqs, cta, seo,
        enable: { internalLinks: req.enable?.internalLinks ?? true, imageSuggestions: req.enable?.imageSuggestions ?? true, schema: req.enable?.schema ?? true },
        knownSlugs: req.knownInternalSlugs ?? [],
      })
      log("writing", `Done: ${doc.sections.length} sections, ${doc.faq.length} FAQs`)
      return doc
    })

    let polished: GeneratedContent = await step(job, "seo", async () => {
      if (req.enable?.seo === false) { log("seo", "skipped"); return content }
      log("seo", "SEO block refined")
      return await seoReview(ctx, content)
    })

    await step(job, "fact-check", async () => {
      log("fact-check", "Running EEAT/fact checks")
      // findings are applied during validateWith below.
    })

    polished = await step(job, "grammar", async () => {
      if (req.enable?.grammar === false) { log("grammar", "skipped"); return polished }
      log("grammar", "Grammar/gap polish")
      const g = await grammarReviewAgent(ctx, polished)
      return await contentGapAgentModel(ctx, g, brief)
    })

    const validation: ValidationResult = validateWith(ctx, polished, req.topic)
    const score: ScoreReport = scoreContent(ctx, polished, validation)
    job.score = score.overall

    const result: GenerationResult = await step(job, "export", async () => {
      const markdown = toMdx(polished)
      log("export", "Exported MDX + JSON")
      return {
        json: polished,
        markdown,
        research,
        brief,
        outline,
        validation,
        score,
        meta: { model: MODEL_ID, generatedAt: new Date().toISOString(), keyword: research.primaryKeyword, contentType: req.type, jobId: job.id, durationMs: Date.now() - start },
      }
    })

    job.resultId = job.id
    job.status = "done"
    job.progress = 100
    return { job: scrubJob(job), result }
  } catch (err) {
    job.status = "failed"
    const failedStage = STAGES.find((s) => job.stages[s]?.status === "running")
    if (failedStage && job.stages[failedStage]) job.stages[failedStage]!.error = err instanceof Error ? err.message : "unknown"
    ctx.log("engine", `FAILED at ${failedStage ?? "?"}: ${err instanceof Error ? err.message : err}`)
    throw err
  } finally {
    job.updatedAt = new Date().toISOString()
    jobsMap.set(job.id, job)
  }
}

/** Strip internal scratch fields before returning to callers. */
export function scrubJob(job: JobStatus): JobStatus {
  return jobStatusSchema.parse({
    id: job.id, type: job.type, topic: job.topic, status: job.status,
    stages: job.stages, progress: job.progress,
    createdAt: job.createdAt, updatedAt: job.updatedAt,
    resultId: job.resultId, score: job.score,
  })
}