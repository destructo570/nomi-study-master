# Nomi Content Engine

Production-grade AI pipeline that generates and manages SEO content for
nomi.com — feature pages, blog, alternative/comparison pages, tutorials,
FAQ, landing, documentation, use-case, and programmatic-SEO pages.

Self-check (no API key):

```bash
bun apps/backend/src/content/example.ts
```

Real generation (requires `OPENAI_API_KEY`):

```bash
bun apps/backend/src/content/example.ts live
```

Admin UI (auth-gated, under the existing admin shell):

- `/admin/content` — dashboard (engine health, recent jobs, templates)
- `/admin/content/generate` — generate form + live result (MDX, score breakdown, stage status)
- `/admin/content/library` — persisted blog posts + generated SEO pages
- `/admin/content/jobs` — per-stage status + logs for every run

Admin API (under `requireAdmin`):

```
POST   /admin/content/generate
POST   /admin/content/generate-and-persist?publish=true
POST   /admin/content/regenerate
GET    /admin/content/jobs
GET    /admin/content/jobs/:id
GET    /admin/content/library
GET    /admin/content/knowledge
GET    /admin/content/competitors
GET    /admin/content/competitors/:id
GET    /admin/content/templates
GET    /admin/content/health
```

---

## Architecture

```
                  GenerateRequest
                        │
                        ▼
                 runEngine (orchestrator)
   research → outline → writing(sec-by-sec) → merge →
   seo → fact-check → grammar → validate → score → export
                        │
                        ▼
                 GenerationResult + JobStatus
```

Every agent consumes the **knowledge base** (`apps/backend/knowledge/*.json`,
validated by Zod at load time) — the single source of truth. Prompts are
modular, composed per-call from system + product + seo + template + research +
competitor blocks; product facts are never embedded in prompt text.

## Folder structure

```
apps/backend/src/content/
  index.ts            public API — import from here
  schemas.ts          Zod source of truth + TS types
  config.ts           model factory (pluggable), token cap, variation presets
  seo.ts              slugify, reading time, Schema.org builder, link graph
  markdown.ts         GeneratedContent → MDX/Markdown
  exporters.ts        toMdx / toJson / toFrontmatter / toMetadata / bundle
  validators.ts       pure rule catalog + validateWith (EEAT/brand/gap)
  scoring.ts          0-100 + 8 subscores + per-subscore explanations
  persist.ts          posts (blog) / seo_pages (others) / seo_jobs
  example.ts          runnable self-check + live

  knowledge/loader.ts reads + validates knowledge/*.json (single source of truth)
  engine/
    context.ts        Ctx — model + knowledge + log (dependency injection)
    templates.ts      per-type section outlines + Schema.org + guidance
    prompts.ts        block builders (system/product/seo/template/research/...)
    orchestrator.ts   runEngine + in-memory job store + status
    agents/
      research.ts     Research Agent → ResearchObject
      outline.ts      Brief + Outline Agents
      writer.ts       Section-by-section Writer + FAQ/CTA/SEO/merge
      review.ts       SEO/fact-check/brand/gap/grammar review agents

apps/backend/knowledge/
  product.json  messaging.json  brand-rules.json  style-guide.json
  faq.json     capabilities.json limitations.json  ctas.json
  competitors/ quizlet.json  notebooklm.json  anki.json  knowt.json
              remnote.json  brainscape.json  studyfetch.json  gizmo.json

apps/backend/prompts/content/
  system.txt  seo.txt  README.txt

packages/db/src/schema.ts   posts, seo_pages, seo_jobs (added)

apps/web/app/(app)/admin/content/   dashboard, generate, library, jobs
apps/web/lib/api/admin-content.ts   typed client for the admin content API
```

## Knowledge base (single source of truth)

Edit `apps/backend/knowledge/*.json` (by hand or via a future write-guarded
admin endpoint) and every generated page reflects it immediately — prompts
never hard-code a feature name, CTA, limitation, or competitor fact. The
loader re-validates every JSON on load, so a malformed edit fails loud.

## Pipeline (mandatory research first)

Every article runs: **research → brief → outline → section-by-section
writing → merge → SEO review → fact-check → grammar edit → brand review →
content-gap → validate → score → export**. Each stage updates a `JobStatus`
(visible at `/admin/content/jobs`); a failed stage records its error and the
caller can re-run.

Section-by-section writing is enforced — one `generateObject` call per
section, with the full context but a narrow per-section schema. This raises
per-section quality and keeps every section on-topic (the spec's
"do NOT generate long articles in one prompt").

## Agents

Research · Outline (Brief + Outline) · Writer (section-by-section) · SEO ·
Fact Check · Grammar · Brand Review · Content Gap · (Schema/Links/Image via
the writer merge step) · Scoring · Exporter. Each is a focused pure-or-
model-light function taking a `Ctx`; model-backed judge variants have seams
wired (`contentGapAgentModel`) with pure heuristics as the floor.

## EEAT

Never hallucinate: a dedicated fact-check rule flags invented features,
unsupported statistics, and invented pricing; brand review flags forbidden
phrases and unbalanced claims ("Nomi is the best"). Comparisons must use
"Choose X if…, Choose Nomi if…" framing. If the model is uncertain, the
system prompt tells it to omit. The scoring EEAT subscore weights fabrication
heavily.

## Content briefs

The Brief Agent emits a typed `ContentBrief` (keyword, intent, funnel,
audience, reading level, tone, word count, CTA, feature ids, competitor) the
writer consumes — research is never passed to the writer as raw prose.

## Validation + scoring

13 pure rules (keyword stuffing, duplicate paragraphs, repetitive wording,
weak CTA, broken markdown, missing FAQ/links/schema/metadata, title/meta
length, …) plus agent-driven EEAT/brand/gap findings via `validateWith`.
Scoring returns 0–100 overall + 8 subscores (seo, readability, naturalness,
productAccuracy, grammar, ctaQuality, eeat, internalLinking); the overall is
honesty/EEAT-weighted; **every subscore carries an explanation string** (the
WHY) so the admin UI can show why a page scored the way it did.

## Schema.org

`buildSchemaOrg` picks the right `@type` per content type: FAQPage, HowTo,
SoftwareApplication, BlogPosting, TechArticle, WebPage (with Organization
publisher + Offer for feature/landing).

## Internal linking

Deterministic graph (`suggestInternalLinks`) ranks Nomi feature slugs by
keyword overlap with the body, prioritising already-published slugs (the
`knownInternalSlugs` seed) — every page knows its neighbour pages without a
second model call.

## Output

`exporters.ts`: `toMdx` (frontmatter + body, the canonical web format),
`toJson`, `toFrontmatter`, `toMetadata`, `toExportBundle`. Slug, meta
description, reading time, keywords, tags, image suggestions, schema, and
internal links all included.

## Future (seams left)

Multi-model orchestration (`setModelFactory`), scheduled publishing, CMS
integrations, automatic web research (live SERP into the Research Agent),
keyword clustering, translation/localization, programmatic-SEO batch driver,
human-approval workflow, A/B testing (variations), analytics wiring, and an
LLM self-review rubric folded into the scorer. The admin UI's live
split-view MDX editor + real-time streaming of the generation screen (vs the
current poll) are the next UI pass.