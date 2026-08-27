/**
 * Content scoring — pure heuristics producing a 0-100 overall with 8
 * subscores and a per-subscore explanation string (the WHY). Honesty-and-
 * EEAT-weighted in the overall blend.
 *
 * Pure today; a model judge rubric is the obvious upgrade path — fold an
 * `aiSubscore()` into the relevant subscore without changing the signature.
 */
import type { Ctx } from "./engine/context"
import { productBlock } from "./engine/prompts"
import type { GeneratedContent, ScoreReport, ValidationResult } from "./schemas"

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "")
  if (word.length <= 3) return 1
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
  word = word.replace(/^y/, "")
  const m = word.match(/[aeiouy]{1,2}/g)
  return m ? m.length : 1
}

function flesch(text: string): number {
  const ws = text.match(/\b[a-z][a-z'-]*\b/gi) ?? []
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  if (ws.length < 5 || sentences.length === 0) return 50
  const syls = ws.reduce((acc, w) => acc + countSyllables(w), 0)
  return 206.835 - 1.015 * (ws.length / sentences.length) - 84.6 * (syls / ws.length)
}

/* ------------------------------------------------------------------ */

function seoScore(c: GeneratedContent): { s: number; why: string } {
  let s = 60
  if (c.seo.title.length >= 40 && c.seo.title.length <= 65) s += 5; else s -= 5
  if (c.seo.metaDescription.length >= 80 && c.seo.metaDescription.length <= 160) s += 5; else s -= 5
  if (c.seo.relatedKeywords.length >= 4) s += 5; else s -= 5
  if (c.seo.semanticKeywords.length >= 4) s += 5; else s -= 3
  if (/^[a-z0-9-]+$/.test(c.seo.slug)) s += 5; else s -= 10
  if (c.seo.h1.toLowerCase() !== c.seo.title.toLowerCase()) s += 5; else s -= 5
  if (c.seo.readingMinutes >= 2 && c.seo.readingMinutes <= 12) s += 5; else s -= 3
  if (c.internalLinks.length >= 2) s += 5
  if (c.schema != null) s += 3
  return { s: clamp(s), why: "Title/Meta length, slug shape, h1≠title, keyword coverage, links, schema." }
}

function readabilityScore(c: GeneratedContent): { s: number; why: string } {
  const body = c.sections.map((s) => `${s.heading}. ${s.body}`).join(" ")
  const fre = flesch(body)
  const distance = Math.abs(fre - 65)
  return { s: clamp(100 - distance * 1.6), why: `Flesch Reading Ease ≈ ${fre.toFixed(1)} (target 55-70).` }
}

function uniquenessScore(c: GeneratedContent): { s: number; why: string } {
  const paras: string[] = []
  for (const s of c.sections) for (const p of s.body.split(/\n{2,}/)) { const t = p.toLowerCase().replace(/\s+/g, " "); if (t.length > 50) paras.push(t) }
  if (paras.length < 2) return { s: 70, why: "Too few paragraphs to measure." }
  let pairs = 0, dupes = 0
  for (let i = 0; i < paras.length; i++) for (let j = i + 1; j < paras.length; j++) {
    pairs++
    const a = new Set(paras[i]!.split(" ").filter((w) => w.length > 3))
    const b = new Set(paras[j]!.split(" ").filter((w) => w.length > 3))
    if (a.size === 0 || b.size === 0) continue
    let inter = 0; for (const w of a) if (b.has(w)) inter++
    if (inter / (a.size + b.size - inter) > 0.45) dupes++
  }
  if (pairs === 0) return { s: 100, why: "No comparable pairs." }
  return { s: clamp(100 - (dupes / pairs) * 130), why: `${dupes} of ${pairs} paragraph pairs too similar.` }
}

function naturalnessScore(c: GeneratedContent): { s: number; why: string } {
  const body = c.sections.map((s) => s.body).join(" ")
  let s = 90
  const hype = (body.match(/\b(revolutionize|game-chang|leverage|ultimate|amazing|incredible|cutting-edge|in today'?s|unlock your potential)\b/gi) ?? []).length
  const filler = (body.match(/\b(very|really|just|actually|basically|essentially|in order to|a lot of|when it comes to|at the end of the day)\b/gi) ?? []).length
  const passive = (body.match(/\b(?:is|are|was|were|be|been|being)\s+\w+ed\b/gi) ?? []).length
  s -= hype * 12; s -= filler * 2; s -= passive * 1.5
  const sentLens = body.split(/[.!?]+/).map((s) => s.trim().split(/\s+/).filter(Boolean).length).filter((n) => n > 0)
  const long = sentLens.filter((n) => n > 28).length
  s -= long * 1.2
  return { s: clamp(s), why: `${hype} hype, ${filler} filler, ${passive} passive, ${long} very-long sentences.` }
}

function productAccuracyScore(c: GeneratedContent, v: ValidationResult): { s: number; why: string } {
  let s = 100, stat = 0, price = 0, hall = 0, brand = 0
  for (const f of v.findings) {
    if (f.rule === "hallucinated-feature") { s -= 30; hall++ }
    if (f.rule === "unsupported-stat") { s -= 20; stat++ }
    if (f.rule === "invented-pricing") { s -= 20; price++ }
    if (f.rule === "buzzword" || f.rule === "exaggerated-claims" || f.rule === "unbalanced-claim") { s -= 10; brand++ }
  }
  void c
  return { s: clamp(s), why: `${hall} hallucinated features, ${stat} unsupported stats, ${price} invented prices, ${brand} brand/EEAT breaches.` }
}

function grammarScore(c: GeneratedContent): { s: number; why: string } {
  let s = 90
  const all = c.sections.map((s) => s.body).join(" ") + " " + c.faq.map((f) => f.a).join(" ")
  // double spaces, space before punctuation
  const dbl = (all.match(/ {2,}/g) ?? []).length
  const spacePunct = (all.match(/\s+[.,!?]/g) ?? []).length
  const capStart = c.sections.filter((s) => s.body && !/^[A-Z]/.test(s.body.trim())).length
  s -= dbl * 1.5 + spacePunct * 1 + capStart * 3
  return { s: clamp(s), why: `${dbl} double-spaces, ${spacePunct} space-before-punct, ${capStart} lowercase-start sections.` }
}

function ctaScore(c: GeneratedContent): { s: number; why: string } {
  const t = c.cta.text.toLowerCase()
  let s = 60
  if (t.length >= 12 && t.length <= 60) s += 10
  if (/\b(try|start|generate|switch|study|turn|create)\b/.test(t)) s += 10
  if (/free\b/.test(t)) s += 5
  if (/\b(best|amazing|ultimate|incredible)\b/.test(t)) s -= 20
  if (c.cta.href && c.cta.href.length > 0) s += 5
  return { s: clamp(s), why: `CTA "${c.cta.text}" — length, action verb, hype check.` }
}

function eeatScore(c: GeneratedContent, v: ValidationResult): { s: number; why: string } {
  let s = 100
  let ext = 0
  for (const f of v.findings) {
    if (f.rule === "unsupported-stat" || f.rule === "invented-pricing" || f.rule === "hallucinated-feature") s -= 25
    if (f.rule === "unbalanced-claim") s -= 20
  }
  // bonus for honest external citations present
  ext = c.externalReferences.length
  s += Math.min(ext, 3) * 3
  return { s: clamp(s), why: `Fabrication/balance findings applied; ${ext} real external citations.` }
}

function internalLinkingScore(c: GeneratedContent): { s: number; why: string } {
  const n = c.internalLinks.length
  return { s: clamp(n >= 3 ? 100 : n === 2 ? 80 : n === 1 ? 60 : 30), why: `${n} suggested internal links.` }
}

const allApplicablePhrases = (ctx: Ctx) => [...ctx.knowledge.messaging.forbiddenPhrases, ...ctx.knowledge.messaging.fillerPhrases]
void productBlock; void allApplicablePhrases // seams for a model judge later

export function scoreContent(ctx: Ctx, content: GeneratedContent, validation: ValidationResult): ScoreReport {
  const seedVerdict = validation
  void ctx
  const sub = {
    seo: seoScore(content),
    readability: readabilityScore(content),
    uniqueness: uniquenessScore(content),
    naturalness: naturalnessScore(content),
    productAccuracy: productAccuracyScore(content, seedVerdict),
    grammar: grammarScore(content),
    ctaQuality: ctaScore(content),
    eeat: eeatScore(content, seedVerdict),
    internalLinking: internalLinkingScore(content),
  }

  const weights = {
    productAccuracy: 0.2, eeat: 0.18, naturalness: 0.16, readability: 0.13,
    seo: 0.13, grammar: 0.08, uniqueness: 0.08, ctaQuality: 0.04, internalLinking: 0.0,
  }
  const overall = clamp(
    sub.productAccuracy.s * weights.productAccuracy +
    sub.eeat.s * weights.eeat +
    sub.naturalness.s * weights.naturalness +
    sub.readability.s * weights.readability +
    sub.seo.s * weights.seo +
    sub.grammar.s * weights.grammar +
    sub.uniqueness.s * weights.uniqueness +
    sub.ctaQuality.s * weights.ctaQuality,
  )

  const explanations: Record<string, string> = {}
  for (const [k, v] of Object.entries(sub)) explanations[k] = `${v.s}/100 — ${v.why}`

  const notes: string[] = []
  if (!validation.passed) notes.push(`Blocked by ${validation.blockingCount} validation error(s).`)
  const weakest = (Object.entries(sub) as [string, { s: number; why: string }][]).sort((a, b) => a[1].s - b[1].s)[0]
  if (weakest && weakest[1].s < 75) notes.push(`Weakest dimension: ${weakest[0]} (${weakest[1].s}).`)

  return {
    overall,
    explanations,
    notes,
    seo: sub.seo.s, readability: sub.readability.s, naturalness: sub.naturalness.s,
    productAccuracy: sub.productAccuracy.s, grammar: sub.grammar.s,
    ctaQuality: sub.ctaQuality.s, eeat: sub.eeat.s, internalLinking: sub.internalLinking.s,
  }
}