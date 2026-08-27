/**
 * Validation pipeline — pure functions over a `GeneratedContent`. Rules
 * stay cheap/heuristic so every page validates without an extra model call.
 * The Rule Agent (EEAT/fact checks) and Brand Review feed extra findings in
 * by composing rules with the agent outputs — see `validateWith`.
 */
import type { Ctx } from "./engine/context"
import { brandReviewFindings, contentGapFindings, factCheckFindings } from "./engine/agents/review"
import type { Finding, GeneratedContent, ValidationResult } from "./schemas"

function sentences(text: string): string[] {
  return text.replace(/\n+/g, " ").split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map((s) => s.trim()).filter(Boolean)
}
function words(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9'-]+/).filter(Boolean)
}

type Rule = { id: string; severity: Finding["severity"]; run: (c: GeneratedContent) => Finding[] }

const rules: Rule[] = [
  /* keyword stuffing */
  {
    id: "keyword-stuffing", severity: "warn",
    run: (c) => {
      const body = [c.seo.h1, c.seo.metaDescription, ...c.sections.map((s) => s.body), ...c.faq.map((f) => f.a)].join(" ")
      const ws = words(body)
      if (ws.length < 100) return []
      const counts = new Map<string, number>()
      for (const w of ws) counts.set(w, (counts.get(w) ?? 0) + 1)
      const primary = ws[0] ?? ""
      const stuffed: { w: string; pct: number }[] = []
      for (const [w, n] of counts) {
        if (w.length < 5 || w === primary) continue
        const pct = n / ws.length
        if (pct > 0.025) stuffed.push({ w, pct })
      }
      return stuffed.slice(0, 3).map((s) => ({ rule: "keyword-stuffing", severity: "warn", message: `Word "${s.w}" appears ${(s.pct * 100).toFixed(1)}% — may read as stuffing.` }))
    },
  },
  /* duplicate paragraphs */
  {
    id: "duplicate-paragraphs", severity: "error",
    run: (c) => {
      const paras: { text: string; ctx: string }[] = []
      for (const s of c.sections) for (const p of s.body.split(/\n{2,}/)) { const t = p.trim().toLowerCase(); if (t.length > 60) paras.push({ text: t, ctx: `section:${s.heading}` }) }
      const seen = new Map<string, string>()
      const out: Finding[] = []
      for (const p of paras) {
        const key = p.text.replace(/\s+/g, " ").slice(0, 120)
        const prev = seen.get(key)
        if (prev && prev !== p.ctx) out.push({ rule: "duplicate-paragraphs", severity: "error", message: "Near-duplicate paragraph across sections.", context: `${prev} ≈ ${p.ctx}` })
        else seen.set(key, p.ctx)
      }
      return out
    },
  },
  /* repetitive wording */
  {
    id: "repetitive-wording", severity: "warn",
    run: (c) => {
      const all: string[] = []
      for (const s of c.sections) all.push(...sentences(s.body))
      const norm = all.map((s) => s.toLowerCase().replace(/\s+/g, " ").slice(0, 80))
      const counts = new Map<string, number>()
      for (const s of norm) counts.set(s, (counts.get(s) ?? 0) + 1)
      const out: Finding[] = []
      for (const [s, n] of counts) if (n >= 3) out.push({ rule: "repetitive-wording", severity: "warn", message: `Sentence repeated ${n}×.`, context: `"${s}…"` })
      return out
    },
  },
  /* weak CTA */
  {
    id: "weak-cta", severity: "warn",
    run: (c) => {
      const t = c.cta.text.toLowerCase()
      if (t.length < 8) return [{ rule: "weak-cta", severity: "warn", message: "CTA too short to be actionable." }]
      if (!/\b(try|start|generate|switch|study|sign up|begin|create|turn|get)\b/.test(t)) return [{ rule: "weak-cta", severity: "warn", message: "CTA lacks an action verb." }]
      if (/\b(best|amazing|ultimate|incredible)\b/.test(t)) return [{ rule: "weak-cta", severity: "warn", message: "CTA uses hype word." }]
      return []
    },
  },
  /* broken markdown */
  {
    id: "broken-markdown", severity: "error",
    run: (c) => (c.sections.map((s) => s.body).join("\n").match(/```/g) ?? []).length % 2 !== 0
      ? [{ rule: "broken-markdown", severity: "error", message: "Odd number of ``` code fences." }]
      : [],
  },
  /* missing FAQ */
  { id: "missing-faq", severity: "warn", run: (c) => c.faq.length < 3 ? [{ rule: "missing-faq", severity: "warn", message: `Only ${c.faq.length} FAQs.`, context: "faq" }] : [] },
  /* missing internal links */
  { id: "missing-internal-links", severity: "warn", run: (c) => c.internalLinks.length === 0 ? [{ rule: "missing-internal-links", severity: "warn", message: "No internal links suggested." }] : [] },
  /* missing schema */
  { id: "missing-schema", severity: "warn", run: (c) => c.schema == null ? [{ rule: "missing-schema", severity: "warn", message: "Schema.org block missing." }] : [] },
  /* missing metadata */
  { id: "missing-metadata", severity: "warn", run: (c) => !c.seo.metaDescription || !c.seo.h1 ? [{ rule: "missing-metadata", severity: "warn", message: "Missing metaDescription or h1." }] : [] },
  /* title length */
  { id: "title-length", severity: "warn", run: (c) => { const l = c.seo.title.length; return l < 30 ? [{ rule: "title-length", severity: "warn", message: `Title ${l} chars.` }] : l > 65 ? [{ rule: "title-length", severity: "warn", message: `Title ${l} chars.` }] : [] } },
  /* meta length */
  { id: "meta-length", severity: "warn", run: (c) => { const l = c.seo.metaDescription.length; return l < 80 ? [{ rule: "meta-length", severity: "warn", message: `Meta ${l} chars.` }] : l > 160 ? [{ rule: "meta-length", severity: "warn", message: `Meta ${l} chars.` }] : [] } },
  /* internal link targets */
  {
    id: "internal-link-missing", severity: "warn",
    run: (c) => {
      // Self-contained: known-good slugs injected by caller via ctx-less fallback.
      // The pipeline filters unknown slugs before this runs, so flag empty or "/" only.
      return c.internalLinks.filter((l) => !l.targetSlug || l.targetSlug === "/").map((l) => ({ rule: "internal-link-missing", severity: "warn", message: `Empty internal link target "${l.targetSlug}".`, context: l.anchorText }))
    },
  },
]

/** Validate against the rule catalog only (pure, no knowledge). */
export function validateContent(content: GeneratedContent): ValidationResult {
  const findings: Finding[] = []
  for (const r of rules) {
    try { findings.push(...r.run(content)) }
    catch (err) { findings.push({ rule: r.id, severity: "error", message: `Rule threw: ${err instanceof Error ? err.message : "unknown"}` }) }
  }
  const blockingCount = findings.filter((f) => f.severity === "error" || f.severity === "block").length
  return { findings, passed: blockingCount === 0, blockingCount }
}

/**
 * Validate content against rule catalog + agent findings (EEAT, brand, gap)
 * that need the knowledge base. The pipeline calls this with a ctx.
 */
export function validateWith(ctx: Ctx, content: GeneratedContent, topic: string): ValidationResult {
  const base = validateContent(content)
  const extras: Finding[] = [
    ...factCheckFindings(ctx, content),
    ...brandReviewFindings(ctx, content),
    ...contentGapFindings(ctx, content, topic),
  ]
  const findings = [...base.findings, ...extras]
  const blockingCount = findings.filter((f) => f.severity === "error" || f.severity === "block").length
  return { findings, passed: blockingCount === 0, blockingCount }
}

export const ruleIds = rules.map((r) => r.id)