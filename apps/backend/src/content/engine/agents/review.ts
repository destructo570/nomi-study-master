/**
 * Review agents that operate on a drafted `GeneratedContent`. Each is a
 * small focused agent: SEO refinement, fact-check, grammar edit, brand
 * review, content-gap check, plus the structured-data + scoring agents.
 *
 * Each returns either an enriched artifact or a list of findings; the
 * pipeline decides what to apply. Most are pure heuristics today (no extra
 * model call); the model-backed variants are wired as `*AgentModel` with
 * the seam left for the future. Keeping the pure implementations as the
 * floor means scoring works without an API key.
 */
import { generateObject } from "ai"
import { z } from "zod"

import type { Ctx } from "../context"
import { briefBlock, productBlock, systemBlock } from "../prompts"
import type {
  ContentBrief, Finding, GeneratedContent, Outline,
  ValidationResult,
} from "../../schemas"
import { findingSchema } from "../../schemas"
import { expectedHeadingsFilled } from "../templates"

/* ------------------------------------------------------------------ */
/* SEO review — refine headings + metadata from intent                */
/* ------------------------------------------------------------------ */

export async function seoReview(ctx: Ctx, content: GeneratedContent): Promise<GeneratedContent> {
  // Heuristic refinement (no model): enforce title length, h1 ≠ title.
  let seo = { ...content.seo }
  if (seo.title.length > 65) seo = { ...seo, title: seo.title.slice(0, 65).trim() }
  if (seo.metaDescription.length > 160) seo = { ...seo, metaDescription: seo.metaDescription.slice(0, 160).trim() }
  if (seo.h1.toLowerCase() === seo.title.toLowerCase()) {
    seo = { ...seo, h1: content.sections[0]?.heading ?? seo.h1 }
  }
  return { ...content, seo }
}

/* ------------------------------------------------------------------ */
/* Fact check — flag claims not supported by knowledge                 */
/* ------------------------------------------------------------------ */

const toolSuffix = /(generator|taker|maker|summarizer|builder|planner|analyzer|overview|tool|app|bot|engine)$/

export function factCheckFindings(ctx: Ctx, content: GeneratedContent): Finding[] {
  const out: Finding[] = []
  const realNames = ctx.knowledge.capabilities.features.map((f) => f.name.toLowerCase())
  const stem = (s: string) => s.toLowerCase().replace(/\s+/g, "").replace(/s$/, "")
  const suspected = /\bnomi'?s\s+([a-z][a-z- ]{3,40})\b/gi
  const scan = (text: string, where: string) => {
    let m: RegExpExecArray | null
    while ((m = suspected.exec(text)) !== null) {
      const name = (m[1] ?? "").trim().toLowerCase()
      if (!name) continue
      const generic = ["free", "plan", "team", "pricing", "platform", "workspace", "free plan", "study workflow"]
      if (generic.includes(name) || toolSuffix.test(name)) continue
      const nameStem = stem(name)
      const isReal = realNames.some((rn) => {
        const rs = stem(rn)
        return rs !== "" && nameStem !== "" && (rs.includes(nameStem) || nameStem.includes(rs))
      })
      if (!isReal) out.push({ rule: "hallucinated-feature", severity: "error", message: `Nomi's "${name}" is not a real product capability — verify.`, context: where })
    }
    // fabricated statistics
    const stat = text.match(/\b(\d{1,3}(\.\d+)?)\s*% (of|boost|increase|more|improve|guarantee)\b/i)
    if (stat) out.push({ rule: "unsupported-stat", severity: "error", message: `Unsupported statistic "${stat[0]}" — remove or cite.`, context: where })
    // invented pricing
    const price = text.match(/\$\d+\s*(per|\/|a month|month|year|annual)?\b/i)
    if (price) out.push({ rule: "invented-pricing", severity: "error", message: `Specific pricing "${price[0]}" — refer to nomi.com/pricing instead.`, context: where })
  }
  for (const s of content.sections) scan(s.body, `section:${s.heading}`)
  for (const f of content.faq) scan(f.a, `faq:${f.q}`)
  return out
}

/* ------------------------------------------------------------------ */
/* Brand review — voice & EEAT                                         */
/* ------------------------------------------------------------------ */

export function brandReviewFindings(ctx: Ctx, content: GeneratedContent): Finding[] {
  const out: Finding[] = []
  const banned = new RegExp(`\\b(${ctx.knowledge.messaging.forbiddenPhrases.join("|")})\\b`, "i")
  const filler = new RegExp(`\\b(${ctx.knowledge.messaging.fillerPhrases.join("|")})\\b`, "i")
  const scan = (text: string, where: string) => {
    const mb = text.match(banned)
    if (mb) out.push({ rule: "buzzword", severity: "error", message: `Forbidden phrase "${mb[0]}" — rewrite plainly.`, context: where })
    const mf = text.match(filler)
    if (mf) out.push({ rule: "filler", severity: "warn", message: `Filler phrase "${mf[0]}" — cut.`, context: where })
    if (/nomi is (the best|better than everyone|universally)/i.test(text)) out.push({ rule: "unbalanced-claim", severity: "error", message: "Unbalanced comparison — use 'Choose Nomi if…' framing.", context: where })
  }
  for (const s of content.sections) scan(s.body, `section:${s.heading}`)
  for (const f of content.faq) scan(f.a, `faq:${f.q}`)
  scan(content.seo.metaDescription, "metaDescription")
  return out
}

/* ------------------------------------------------------------------ */
/* Content gap — missing template sections                             */
/* ------------------------------------------------------------------ */

export function contentGapFindings(ctx: Ctx, content: GeneratedContent, topic: string): Finding[] {
  const expected = expectedHeadingsFilled(content.type, topic).map((h) => h.toLowerCase())
  const got = content.sections.map((s) => s.heading.toLowerCase())
  const missing = expected.filter((e) => !got.some((g) => g.includes(e.split(":")[0] ?? e) || e.includes(g.split(":")[0] ?? g)))
  return missing.map((h) => ({ rule: "missing-template-section", severity: "warn", message: `Template section missing or renamed: "${h}".`, context: "sections" }))
}

/* ------------------------------------------------------------------ */
/* Model-backed judges (seam for the future; pure floor above)        */
/* ------------------------------------------------------------------ */

export async function grammarReviewAgent(ctx: Ctx, content: GeneratedContent): Promise<GeneratedContent> {
  // Heuristic grammar polish: collapses repeated spaces / blank lines, fixes common issues.
  const tidy = (s: string) => s.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").replace(/\s+([.,!?])/g, "$1").trim()
  return {
    ...content,
    sections: content.sections.map((s) => ({ ...s, body: tidy(s.body), heading: s.heading.trim() })),
    faq: content.faq.map((f) => ({ q: f.q.trim(), a: tidy(f.a) })),
  }
}

export async function contentGapAgentModel(ctx: Ctx, content: GeneratedContent, brief: ContentBrief): Promise<GeneratedContent> {
  const system = [systemBlock(), productBlock(ctx), briefBlock(brief)].join("\n\n")
  const prompt = [
    "## TASK: identify any missing template sections for this page and write them. If nothing is missing, return the same content unchanged.",
    "Current sections:\n" + content.sections.map((s) => `- ${s.heading}`).join("\n"),
    "Return ONLY the full content JSON per the content schema.",
  ].join("\n")
  // ponytail: keep the pure `contentGapFindings` as the floor; the model variant
  // is a no-op stub here so the seam is present without paying for it. Wire the
  // call when scoring shows recurring gaps.
  void system; void prompt; void generateObject; void z; void findingSchema
  return content
}
export type { ValidationResult }