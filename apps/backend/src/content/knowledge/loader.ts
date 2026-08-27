/**
 * Knowledge loader — the single source of truth for everything Nomi.
 *
 * Reads structured JSON files from `apps/backend/knowledge/` and validates
 * each with Zod at load time. Every generator/agent consumes these objects;
 * prompts never embed product facts. Editing a JSON file (via the admin API
 * or by hand) immediately flows into every generated page.
 *
 * The cache is a module singleton; `reloadKnowledge()` clears it for tests
 * and for the admin "save & reload" flow.
 */
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { z } from "zod"

const KNOWLEDGE_DIR = path.resolve(import.meta.dir, "../../../knowledge")

/* ------------------------------------------------------------------ */
/* Schemas                                                              */
/* ------------------------------------------------------------------ */

const productSchema = z.object({
  name: z.string(),
  domain: z.string(),
  tagline: z.string(),
  pitch: z.string(),
  positioning: z.string(),
  audience: z.array(z.string()),
  foundedNotes: z.string(),
  freeTier: z.string(),
  pricingNote: z.string(),
})
export type ProductKnowledge = z.infer<typeof productSchema>

const messagingSchema = z.object({
  tone: z.array(z.string()),
  rules: z.array(z.string()),
  forbiddenPhrases: z.array(z.string()),
  fillerPhrases: z.array(z.string()),
})
export type MessagingKnowledge = z.infer<typeof messagingSchema>

const brandRulesSchema = z.object({
  brandProduct: z.string(),
  brandSingular: z.boolean(),
  capitalization: z.string(),
  urlStyle: z.string(),
  headingStyle: z.string(),
  listStyle: z.string(),
  codeAndMath: z.string(),
  emojiPolicy: z.string(),
  ctaStyle: z.string(),
  comparisonTone: z.string(),
  numbersPolicy: z.string(),
})
export type BrandRules = z.infer<typeof brandRulesSchema>

const styleGuideSchema = z.object({
  proseRules: z.array(z.object({ rule: z.string(), guideline: z.string() })),
  renderingRules: z.array(z.object({ rule: z.string(), guideline: z.string() })),
})
export type StyleGuide = z.infer<typeof styleGuideSchema>

const faqSchema = z.object({
  faqs: z.array(z.object({ q: z.string(), a: z.string() })),
})
export type FaqKnowledge = z.infer<typeof faqSchema>

const capabilitiesSchema = z.object({
  features: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      blurb: z.string(),
      slug: z.string(),
      category: z.enum(["ingest", "structure", "test", "remember", "learn-differently"]),
      pitchPoints: z.array(z.string()),
    }),
  ),
})
export type Capabilities = z.infer<typeof capabilitiesSchema>

const limitationsSchema = z.object({
  limitations: z.array(z.string()),
  unsupportedClaims: z.array(z.string()),
})
export type Limitations = z.infer<typeof limitationsSchema>

const ctasSchema = z.object({
  primary: z.object({ text: z.string(), href: z.string() }),
  byType: z.record(z.string(), z.object({ text: z.string(), focus: z.string() })),
})
export type CtasKnowledge = z.infer<typeof ctasSchema>

const competitorSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  audience: z.string(),
  positioning: z.string(),
  coreFeatures: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recentAiFeatures: z.string(),
  pricingNote: z.string(),
  commonPraise: z.string(),
  commonComplaints: z.string(),
  integrations: z.array(z.string()),
  documentation: z.string().url(),
  pricingPage: z.string().url(),
  positioningVsNomi: z.string(),
})
export type Competitor = z.infer<typeof competitorSchema>

/* ------------------------------------------------------------------ */
/* Loader                                                               */
/* ------------------------------------------------------------------ */

export type Knowledge = {
  product: ProductKnowledge
  messaging: MessagingKnowledge
  brandRules: BrandRules
  styleGuide: StyleGuide
  faq: FaqKnowledge
  capabilities: Capabilities
  limitations: Limitations
  ctas: CtasKnowledge
  competitors: Record<string, Competitor>
}

let cache: Knowledge | null = null

function readJson<T>(name: string, schema: z.ZodType<T>): T {
  const raw = readFileSync(path.join(KNOWLEDGE_DIR, `${name}.json`), "utf8")
  const parsed = schema.safeParse(JSON.parse(raw))
  if (!parsed.success) {
    throw new Error(`[knowledge] ${name}.json failed validation: ${parsed.error.message}`)
  }
  return parsed.data
}

function readCompetitors(): Record<string, Competitor> {
  const dir = path.join(KNOWLEDGE_DIR, "competitors")
  const out: Record<string, Competitor> = {}
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".json")) continue
    const raw = readFileSync(path.join(dir, file), "utf8")
    const parsed = competitorSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) {
      throw new Error(`[knowledge] competitors/${file} failed validation: ${parsed.error.message}`)
    }
    out[parsed.data.id] = parsed.data
  }
  return out
}

export function loadKnowledge(): Knowledge {
  if (cache) return cache
  cache = {
    product: readJson("product", productSchema),
    messaging: readJson("messaging", messagingSchema),
    brandRules: readJson("brand-rules", brandRulesSchema),
    styleGuide: readJson("style-guide", styleGuideSchema),
    faq: readJson("faq", faqSchema),
    capabilities: readJson("capabilities", capabilitiesSchema),
    limitations: readJson("limitations", limitationsSchema),
    ctas: readJson("ctas", ctasSchema),
    competitors: readCompetitors(),
  }
  return cache
}

export function reloadKnowledge(): Knowledge {
  cache = null
  return loadKnowledge()
}

/** Convenience: feature lookup by id. */
export function featureById(id: string) {
  return loadKnowledge().capabilities.features.find((f) => f.id === id)
}

/** All valid Nomi on-site slugs for internal linking. */
export function internalSlugs(): string[] {
  return loadKnowledge().capabilities.features.map((f) => f.slug)
}