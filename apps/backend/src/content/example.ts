/**
 * Runnable self-check + live generation for the content engine.
 *
 *   bun apps/backend/src/content/example.ts            # pure self-check (no API)
 *   bun apps/backend/src/content/example.ts live        # real generation through the full pipeline
 *
 * The self-check exercises the pure validators/scorer/exporter on a
 * hardcoded, honest sample page — always runnable, fails loudly on a
 * pipeline regression. Knowledge-base integrity is also checked (the loader
 * must validate every JSON file at load time).
 */
import { writeFileSync } from "node:fs"
import path from "node:path"

import { validateContent } from "./validators"
import { scoreContent } from "./scoring"
import { toMdx, toExportBundle } from "./exporters"
import { loadKnowledge } from "./knowledge/loader"
import { defaultCtx } from "./engine/context"
import { runEngine } from "./engine/orchestrator"
import type { GeneratedContent } from "./schemas"

const OUT = path.resolve(import.meta.dir, "../../../../outputs/content")

const sample: GeneratedContent = {
  type: "feature",
  seo: {
    title: "AI Note Taker — Turn Lectures & PDFs into Clean Notes",
    slug: "ai-note-taker",
    metaDescription: "Nomi's AI note taker turns lectures, PDFs, and YouTube videos into clean, structured notes — then makes flashcards, quizzes, and a study guide. Free to start.",
    h1: "AI Note Taker",
    relatedKeywords: ["ai note taker", "lecture notes ai", "notes from pdf", "study notes generator"],
    semanticKeywords: ["note-taking", "lecture transcription", "summarise notes"],
    targetAudience: "College students",
    searchIntent: "commercial",
    readingMinutes: 4,
  },
  sections: [
    { level: 2, heading: "Introduction", body: "An AI note taker takes raw material — a lecture, a PDF, a YouTube video, or your own notes — and turns it into clean, structured notes you can study. Nomi does this and then builds flashcards, quizzes, a mind map, and a study guide from those notes, with spaced repetition so the material sticks." },
    { level: 2, heading: "The problem", body: "Most students end up with notes that are long, unstructured, and hard to revise from. You copy slides, pause the lecture, and by exam week you have hundreds of pages and no idea what matters." },
    { level: 2, heading: "How Nomi handles AI notes", body: "Upload a PDF, paste notes, or import a YouTube lecture. Nomi reads the material and writes structured notes: clear headings, key definitions, and connections. Because the same source feeds Nomi's AI Notes feature, you get flashcards and a quiz from the same content." },
    { level: 2, heading: "Benefits", body: "- Notes in minutes, not hours.\n- Structured headings and definitions.\n- Flashcards and quizzes from the same material.\n- Spaced repetition schedules review.\n- Works with PDFs, YouTube links, and pasted text." },
    { level: 2, heading: "How Nomi works", body: "1. Add a source — upload a PDF, import a YouTube lecture, or paste notes.\n2. Nomi structures it into AI Notes plus a summary.\n3. Nomi generates flashcards and a quiz from the same source.\n4. Spaced repetition surfaces cards right before you'd forget them." },
    { level: 2, heading: "Frequently asked questions", body: "See the FAQ list below for common questions about Nomi's AI note taker." },
  ],
  faq: [
    { q: "Is Nomi's AI note taker free?", a: "Yes — Nomi has a free plan that covers note generation. Paid plans add higher limits and AI podcasts." },
    { q: "Can Nomi take notes from a YouTube lecture?", a: "Yes. Import the YouTube link and Nomi turns the lecture into notes, flashcards, a quiz, and a study guide." },
    { q: "Will the notes be accurate?", a: "Nomi writes notes from your uploaded material, but the AI can be wrong — verify key facts before exams." },
    { q: "Does Nomi do my homework for me?", a: "No. Nomi helps you learn the material — notes, flashcards, and quizzes — rather than writing assignments for you." },
  ],
  cta: { text: "Turn your lecture into notes — free", href: "#signup" },
  internalLinks: [
    { anchorText: "AI Flashcards", targetSlug: "/ai-flashcard-generator", reason: "Generated from the same source." },
    { anchorText: "AI Notes", targetSlug: "/ai-notes", reason: "The notes feature itself." },
  ],
  externalReferences: [],
  imageIdeas: [
    { kind: "Hero illustration", placement: "hero", description: "A lecture transcript on the left flowing into structured note cards on the right.", altText: "Lecture turned into structured notes" },
  ],
  schema: { "@context": "https://schema.org", "@type": "SoftwareApplication", applicationCategory: "EducationApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
}

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`self-check failed: ${msg}`)
  console.log(`  ✓ ${msg}`)
}

function selfCheck(content: GeneratedContent): void {
  const ctx = defaultCtx()
  const validation = validateContent(content) // pure; full ctx variant used in pipeline
  const score = scoreContent(ctx, content, validation)
  const md = toMdx(content)
  void toExportBundle
  assert(typeof score.overall === "number" && score.overall >= 0 && score.overall <= 100, "overall in [0,100]")
  assert(md.includes("# AI Note Taker"), "markdown has H1")
  assert(md.includes("---"), "markdown has frontmatter")
  assert(score.productAccuracy >= 90, `product accuracy high (got ${score.productAccuracy}) — sample is honest`)
  assert(Object.keys(score.explanations).length >= 8, "every subscore has an explanation")
  console.log(`\n  overall=${score.overall} seo=${score.seo} readability=${score.readability} naturalness=${score.naturalness} product=${score.productAccuracy} grammar=${score.grammar} cta=${score.ctaQuality} eeat=${score.eeat} links=${score.internalLinking}`)
  console.log(`  validation: passed=${validation.passed} findings=${validation.findings.length}`)
  for (const f of validation.findings) console.log(`    - [${f.severity}] ${f.rule}: ${f.message}`)
}

async function live(): Promise<void> {
  console.log("\n[live] running full engine for 'AI Note Taker' (feature)…")
  const ctx = defaultCtx()
  const { job, result } = await runEngine(
    { type: "feature", topic: "AI Note Taker", angle: "college students turning lectures + PDFs into notes", targetWordCount: 800, knownInternalSlugs: [] },
    ctx,
  )
  console.log(`  job ${job.id} status=${job.status} score=${job.score}`)
  writeFileSync(path.join(OUT, "live-ai-note-taker.json"), JSON.stringify(result, null, 2))
  writeFileSync(path.join(OUT, "live-ai-note-taker.mdx"), result.markdown)
  console.log("  ✓ wrote outputs/content/live-ai-note-taker.{json,mdx}")
}

async function main(): Promise<void> {
  const liveFlag = process.argv.slice(2).includes("live")
  console.log("Nomi content engine — self-check")
  loadKnowledge() // fails loud if any knowledge JSON is malformed
  console.log("  ✓ knowledge layer loaded (all JSON files validated)")
  selfCheck(sample)
  writeFileSync(path.join(OUT, "sample-ai-note-taker.mdx"), toMdx(sample))
  writeFileSync(path.join(OUT, "sample-ai-note-taker.json"), JSON.stringify(sample, null, 2))
  console.log("  ✓ wrote sample outputs")
  if (liveFlag) await live()
  console.log("\nOK")
}

main().catch((err) => { console.error("FAIL:", err); process.exit(1) })