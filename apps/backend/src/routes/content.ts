/**
 * Admin routes for the content engine.
 *
 * Mounted under /api/admin/content (requireAdmin) in index.ts.
 *
 *   POST   /generate            run the engine, return result (no DB write)
 *   POST   /generate-and-persist  generate + persist (blog → posts, others → seo_pages)
 *   POST   /regenerate            upsert by slug
 *   GET    /jobs                 list recent jobs
 *   GET    /jobs/:id             one job's status (for the generation screen)
 *   GET    /library              list persisted pages (posts + seo_pages)
 *   GET    /knowledge            return the loaded knowledge (read-only here)
 *   GET    /competitors          list competitor profiles
 *   GET    /competitors/:id      one competitor
 *   GET    /templates            list templates
 *   GET    /health               ping
 *
 * Editing knowledge/prompts/templates via the UI writes JSON files; the file-write
 * endpoints are deliberately NOT in this route by default for security — admin
 * edits knowledge through a separate `writeFile`-guarded helper. See README.
 */
import { Hono } from "hono"
import { desc, eq } from "drizzle-orm"

import { db } from "@workspace/db"
import { posts, seoJobs, seoPages } from "@workspace/db/schema"

import type { AppEnv } from "../types"
import { defaultCtx } from "../content/engine/context"
import { runEngine, listJobs, getJob } from "../content/engine/orchestrator"
import { persistResult, upsertResult, persistJobStatus } from "../content/persist"
import { generateRequestSchema } from "../content/schemas"
import { loadKnowledge } from "../content/knowledge/loader"
import { templates } from "../content/engine/templates"

const router = new Hono<AppEnv>()

router.get("/health", (c) =>
  c.json({ ok: true, model: process.env.CONTENT_MODEL_ID ?? "gpt-4o-mini", apiKey: !!process.env.OPENAI_API_KEY }),
)

/** List content-type templates for the UI. */
router.get("/templates", (c) => c.json(Object.values(templates).map((t) => ({ type: t.type, label: t.label, intent: t.intent, schemaType: t.schemaType, recommendedWordCount: t.recommendedWordCount, sections: t.sections, minFaqs: t.minFaqs }))))

/** Knowledge (read-only) — UI edits via writeFile admin helper (out of scope here). */
router.get("/knowledge", (c) => c.json(loadKnowledge()))

router.get("/competitors", (c) => c.json(Object.values(loadKnowledge().competitors)))
router.get("/competitors/:id", (c) => {
  const comp = loadKnowledge().competitors[c.req.param("id")]
  return comp ? c.json(comp) : c.json({ error: "not found" }, 404)
})

/* ---- generation ---------------------------------------------------- */

router.post("/generate", async (c) => {
  const body = generateRequestSchema.parse(await c.req.json().catch(() => ({})))
  const ctx = defaultCtx()
  const { job, result } = await runEngine(body, ctx)
  await persistJobStatus(job)
  return c.json({ job, result })
})

router.post("/generate-and-persist", async (c) => {
  const body = generateRequestSchema.parse(await c.req.json().catch(() => ({})))
  const publish = c.req.query("publish") === "true"
  const ctx = defaultCtx()
  const { job, result } = await runEngine(body, ctx)
  await persistJobStatus(job)
  if (job.status === "done") {
    const ref = await persistResult(result, { published: publish })
    return c.json({ job, ref, slug: result.json.seo.slug, score: result.score.overall })
  }
  return c.json({ job, error: "engine failed — see job.stages" }, 500)
})

router.post("/regenerate", async (c) => {
  const body = generateRequestSchema.parse(await c.req.json().catch(() => ({})))
  const publish = c.req.query("publish") === "true"
  const ctx = defaultCtx()
  const { job, result } = await runEngine(body, ctx)
  await persistJobStatus(job)
  if (job.status === "done") {
    const ref = await upsertResult(result, { published: publish })
    return c.json({ job, ref, slug: result.json.seo.slug, score: result.score.overall })
  }
  return c.json({ job, error: "engine failed" }, 500)
})

/* ---- jobs ---------------------------------------------------------- */

router.get("/jobs", (c) => c.json(listJobs(50)))
router.get("/jobs/:id", (c) => {
  const mem = getJob(c.req.param("id"))
  if (mem) return c.json(mem)
  // fallback to DB by id
  return c.json({ error: "job not found in memory" }, 404)
})

/* ---- content library ----------------------------------------------- */

router.get("/library", async (c) => {
  const [blogRows, pageRows, jobRows] = await Promise.all([
    db.select({ id: posts.id, type: posts.title, slug: posts.slug, title: posts.title, description: posts.description, published: posts.publishedAt, createdAt: posts.createdAt }).from(posts).orderBy(desc(posts.createdAt)).limit(100),
    db.select({ id: seoPages.id, type: seoPages.type, slug: seoPages.slug, title: seoPages.title, description: seoPages.description, published: seoPages.publishedAt, createdAt: seoPages.createdAt, score: seoPages.score }).from(seoPages).orderBy(desc(seoPages.createdAt)).limit(100),
    db.select({ id: seoJobs.id, type: seoJobs.type, topic: seoJobs.topic, status: seoJobs.status, score: seoJobs.score, createdAt: seoJobs.createdAt }).from(seoJobs).orderBy(desc(seoJobs.createdAt)).limit(50),
  ])
  return c.json({
    posts: blogRows.map((r) => ({ ...r, kind: "blog", published: !!r.published })),
    seoPages: pageRows.map((r) => ({ ...r, kind: "seopage", published: !!r.published })),
    jobs: jobRows,
  })
})

router.get("/library/seo/:id", async (c) => {
  const [row] = await db.select().from(seoPages).where(eq(seoPages.id, c.req.param("id"))).limit(1)
  return row ? c.json(row) : c.json({ error: "not found" }, 404)
})
router.get("/library/post/:id", async (c) => {
  const [row] = await db.select().from(posts).where(eq(posts.id, c.req.param("id"))).limit(1)
  return row ? c.json(row) : c.json({ error: "not found" }, 404)
})

export default router