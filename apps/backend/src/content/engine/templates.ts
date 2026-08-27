/**
 * Templates — the section outline + Schema.org + per-type rules. Type is
 * data, not code; adding a content type = a registry entry. Templates here
 * are the *seed* outlines the Outline Agent starts from; it may add or
 * reorder sections, but every `required: true` section must survive.
 */
import type { ContentType, OutlineSection } from "../schemas"

export type Template = {
  type: ContentType
  label: string
  intent: string
  schemaType: string
  guidance: string
  sections: OutlineSection[]
  minFaqs: number
  recommendedWordCount: number
  /** Internal-links this page type should usually point to. */
  recommendedInternalLinkCategories: string[]
}

const t = (s: Omit<OutlineSection, "required"> & { required?: boolean }): OutlineSection => ({
  id: s.id, heading: s.heading, brief: s.brief, words: s.words,
  required: s.required ?? true,
})

export const templates: Record<ContentType, Template> = {
  feature: {
    type: "feature",
    label: "Feature Page",
    intent: "Rank for a Nomi feature keyword (e.g. 'AI Flashcard Generator').",
    schemaType: "SoftwareApplication",
    guidance:
      "Lead with the problem, then how Nomi specifically solves it, concrete benefits, how it works (real features only), FAQ, CTA.",
    sections: [
      t({ id: "introduction", heading: "Introduction", brief: "What {topic} is, why a student needs it. 2 short paragraphs.", words: 90 }),
      t({ id: "problem", heading: "The problem", brief: "The honest pain point {topic} addresses.", words: 80 }),
      t({ id: "solution", heading: "How Nomi handles {topic}", brief: "Specifically what Nomi does. Reference real capabilities from knowledge.", words: 120 }),
      t({ id: "benefits", heading: "Benefits", brief: "4-6 concrete student benefits as bullets.", words: 100 }),
      t({ id: "how-nomi-works", heading: "How Nomi works", brief: "3-4 numbered steps of the Nomi workflow.", words: 120 }),
      t({ id: "faq", heading: "Frequently asked questions", brief: "Honest Q&As specific to {topic}.", words: 60, required: false }),
    ],
    minFaqs: 4,
    recommendedWordCount: 800,
    recommendedInternalLinkCategories: ["structure", "test", "remember"],
  },
  blog: {
    type: "blog",
    label: "Blog Article",
    intent: "Informational ranking; Nomi recommended naturally at the end.",
    schemaType: "BlogPosting",
    guidance: "Genuinely useful article; Nomi is recommended, not sold the whole way through.",
    sections: [
      t({ id: "introduction", heading: "Introduction", brief: "Hook + framing for a student.", words: 100 }),
      t({ id: "explanation", heading: "Why this works", brief: "Underlying idea in plain terms + one concrete example.", words: 150 }),
      t({ id: "examples", heading: "Examples", brief: "2-3 concrete student-relatable examples.", words: 120 }),
      t({ id: "tips", heading: "Tips you can use today", brief: "4-6 actionable bullets.", words: 100 }),
      t({ id: "faq", heading: "Frequently asked questions", brief: "4 Q&As.", words: 60, required: false }),
    ],
    minFaqs: 4,
    recommendedWordCount: 900,
    recommendedInternalLinkCategories: ["structure", "test"],
  },
  alternative: {
    type: "alternative",
    label: "Alternative Page",
    intent: "Rank for '[competitor] alternative'. Position Nomi.",
    schemaType: "WebPage",
    guidance: "Fair, factual overview of the named tool; honest comparison; pros/cons incl. Nomi's; why switch to Nomi; FAQ; CTA. Never trash the competitor.",
    sections: [
      t({ id: "overview", heading: "Overview", brief: "What the named tool is, who uses it. Factual.", words: 80 }),
      t({ id: "comparison", heading: "How Nomi compares", brief: "Markdown table + honest take.", words: 160 }),
      t({ id: "pros-cons", heading: "Pros and cons", brief: "Honest pros and cons of each, incl. Nomi's cons.", words: 120 }),
      t({ id: "why-nomi", heading: "Why students switch to Nomi", brief: "2-3 real reasons grounded in capabilities.", words: 100 }),
      t({ id: "pricing", heading: "Pricing", brief: "Generic framing only — no invented competitor prices.", words: 60 }),
      t({ id: "faq", heading: "Frequently asked questions", brief: "Switching Q&As.", words: 60, required: false }),
    ],
    minFaqs: 4,
    recommendedWordCount: 900,
    recommendedInternalLinkCategories: ["structure", "test", "remember"],
  },
  comparison: {
    type: "comparison",
    label: "Comparison Page",
    intent: "Nomi vs one named competitor.",
    schemaType: "WebPage",
    guidance: "Neutral intros, feature-by-feature table, use-case recommendations, FAQ, CTA. Honest about where the competitor wins.",
    sections: [
      t({ id: "introduction", heading: "Introduction", brief: "What this comparison is, who it's for.", words: 80 }),
      t({ id: "comparison", heading: "Feature comparison", brief: "Markdown table across 5-7 dimensions + reading.", words: 180 }),
      t({ id: "use-cases", heading: "Which should you choose?", brief: "'Choose [competitor] if…' / 'Choose Nomi if…'.", words: 100 }),
      t({ id: "faq", heading: "Frequently asked questions", brief: "Q&As.", words: 60, required: false }),
    ],
    minFaqs: 4,
    recommendedWordCount: 900,
    recommendedInternalLinkCategories: ["structure", "test"],
  },
  tutorial: {
    type: "tutorial",
    label: "How-to / Tutorial",
    intent: "Steps for a 'how to' query.",
    schemaType: "HowTo",
    guidance: "Clear numbered steps, each what + why. Name Nomi features where they're the fastest path. FAQ + CTA.",
    sections: [
      t({ id: "introduction", heading: "Introduction", brief: "What you'll be able to do after this guide.", words: 70 }),
      t({ id: "steps", heading: "Step-by-step", brief: "5-8 numbered steps as H3s.", words: 220 }),
      t({ id: "tips", heading: "Tips", brief: "3-4 gotchas.", words: 80 }),
      t({ id: "faq", heading: "Frequently asked questions", brief: "Q&As.", words: 60, required: false }),
    ],
    minFaqs: 3,
    recommendedWordCount: 700,
    recommendedInternalLinkCategories: ["ingest", "structure", "test"],
  },
  faq: {
    type: "faq",
    label: "FAQ Page",
    intent: "Question-shaped query; thin page of Q&As.",
    schemaType: "FAQPage",
    guidance: "1-paragraph intro, 6-10 honest Q&As, short CTA.",
    sections: [
      t({ id: "introduction", heading: "Introduction", brief: "1 short paragraph framing {topic}.", words: 60 }),
      t({ id: "faq", heading: "Frequently asked questions", brief: "6-10 Q&As.", words: 60, required: false }),
    ],
    minFaqs: 6,
    recommendedWordCount: 500,
    recommendedInternalLinkCategories: ["structure", "test"],
  },
  landing: {
    type: "landing",
    label: "Landing Page",
    intent: "Convert toward signup; SEO secondary.",
    schemaType: "WebPage",
    guidance: "Punchy value prop, feature buckets tied to outcomes, honest outcomes, CTA, FAQ. No fake testimonials.",
    sections: [
      t({ id: "value-prop", heading: "Why students use Nomi", brief: "One-line value prop + 2 sentences on the workflow.", words: 70 }),
      t({ id: "features", heading: "What Nomi does", brief: "3-4 feature buckets.", words: 160 }),
      t({ id: "outcomes", heading: "What students get", brief: "Concrete outcomes as bullets.", words: 80 }),
      t({ id: "how-nomi-works", heading: "How Nomi works", brief: "3-4 numbered steps.", words: 120 }),
      t({ id: "faq", heading: "Frequently asked questions", brief: "Q&As.", words: 60, required: false }),
    ],
    minFaqs: 3,
    recommendedWordCount: 600,
    recommendedInternalLinkCategories: ["structure", "test", "remember"],
  },
  doc: {
    type: "doc",
    label: "Documentation",
    intent: "How to use a Nomi feature, factual/neutral.",
    schemaType: "TechArticle",
    guidance: "Reference tone. What it does, prerequisites, steps, edge cases, related docs. No marketing voice.",
    sections: [
      t({ id: "overview", heading: "Overview", brief: "What {topic} does and when to use it.", words: 80 }),
      t({ id: "how-to", heading: "How to use it", brief: "Numbered steps.", words: 180 }),
      t({ id: "notes", heading: "Notes and limitations", brief: "Edge cases and constraints. Honest.", words: 80 }),
      t({ id: "faq", heading: "Frequently asked questions", brief: "Q&As.", words: 60, required: false }),
    ],
    minFaqs: 3,
    recommendedWordCount: 600,
    recommendedInternalLinkCategories: ["ingest", "structure"],
  },
  usecase: {
    type: "usecase",
    label: "Use Case Page",
    intent: "Rank for '[audience] study tool' / '[task]' use cases.",
    schemaType: "WebPage",
    guidance: "The audience's concrete situation, the workflow they'd run in Nomi, outcomes, FAQ, CTA.",
    sections: [
      t({ id: "situation", heading: "The situation", brief: "The audience's real study scenario.", words: 100 }),
      t({ id: "workflow", heading: "How to do it in Nomi", brief: "Steps using real Nomi features.", words: 160 }),
      t({ id: "outcomes", heading: "What you get", brief: "Concrete outcomes.", words: 80 }),
      t({ id: "faq", heading: "Frequently asked questions", brief: "Q&As.", words: 60, required: false }),
    ],
    minFaqs: 3,
    recommendedWordCount: 700,
    recommendedInternalLinkCategories: ["ingest", "structure", "test"],
  },
  programmatic: {
    type: "programmatic",
    label: "Programmatic SEO Page",
    intent: "Template + dataset-driven page at scale.",
    schemaType: "WebPage",
    guidance: "Compact, template-driven page. Pulls structured fields from the brief; minimal prose; strong internal linking.",
    sections: [
      t({ id: "overview", heading: "Overview", brief: "1-2 sentences on {topic}.", words: 80 }),
      t({ id: "key-facts", heading: "Key facts", brief: "Bullets of structured facts from brief.", words: 100 }),
      t({ id: "how-nomi-helps", heading: "How Nomi helps", brief: "2-3 sentences grounded in capabilities.", words: 100 }),
      t({ id: "faq", heading: "Frequently asked questions", brief: "Q&As.", words: 60, required: false }),
    ],
    minFaqs: 3,
    recommendedWordCount: 500,
    recommendedInternalLinkCategories: ["structure", "test"],
  },
}

export function getTemplate(type: ContentType): Template {
  return templates[type]
}

/** Resolve {topic} placeholders in briefs (read-only view for prompts). */
export function sectionBriefsFor(type: ContentType, topic: string): string {
  return getTemplate(type).sections
    .map((s, i) => `${i + 1}. [${s.required ? "required" : "optional"}] "${s.heading.replace("{topic}", topic)}" (~${s.words}w) — ${s.brief.replace("{topic}", topic)}`)
    .join("\n")
}

export function expectedHeadingsFilled(type: ContentType, topic: string): string[] {
  return getTemplate(type).sections.filter((s) => s.required).map((s) => s.heading.replace("{topic}", topic))
}