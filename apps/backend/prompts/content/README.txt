# Content-generation prompts — Nomi

Loader: apps/backend/src/content/prompts.ts  →  loadContentPrompt

This subdirectory holds the text fragments composed into the per-generation
system+user prompt:

  system.txt   — base writer persona, hard rules, honesty constraints.
  seo.txt      — guidance for the `seo` block fields (title/slug/meta/etc).

The per-content-type guidance (feature / blog / alternative / comparison /
tutorial / faq / landing) is NOT here — it lives as typed objects in
`apps/backend/src/content/templates.ts`, because that guidance is
data-driven (section outlines, word counts, Schema.org @type) and composing
it from TS is less error-prone than templating it in prose.

Composition (see `composePrompt`):
  system  = system + productContextBlock + seoBlock
  prompt  = typeBlock(template) + researchBlock(research) + variant tag

Product facts (features, limitations, CTAs, FAQs) come from
`product-context.ts` — the single source of truth — never duplicated here.