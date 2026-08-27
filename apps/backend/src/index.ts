import { Hono } from "hono"
import { bodyLimit } from "hono/body-limit"
import { cors } from "hono/cors"
import { secureHeaders } from "hono/secure-headers"

import { auth } from "./lib/better-auth"
import { authContext, requireAdmin } from "./middleware/auth"
import { errorHandler } from "./middleware/error"
import type { AppEnv } from "./types"

import admin from "./routes/admin"
import archive from "./routes/archive"
import billing from "./routes/billing"
import chapters from "./routes/chapters"
import discount from "./routes/discount"
import chatSessions from "./routes/chat-sessions"
import content from "./routes/content"
import exams from "./routes/exams"
import feedback from "./routes/feedback"
import flashcards from "./routes/flashcards"
import generateCourse from "./routes/generate-course"
import llmTest from "./routes/llm-test"
import me from "./routes/me"
import onboarding from "./routes/onboarding"
import mindmaps from "./routes/mindmaps"
import notebooks from "./routes/notebooks"
import podcasts from "./routes/podcasts"
import quizzes from "./routes/quizzes"
import shelves from "./routes/shelves"
import sources from "./routes/sources"
import { startFileProcessWorker } from "./workers/file-process"
import { startPodcastWorker } from "./workers/podcast-generate"
import { startSourceEmbedWorker } from "./workers/source-embed"
import { startUrlIngestWorker } from "./workers/url-ingest"

const app = new Hono<AppEnv>()

app.use("*", secureHeaders())
app.use(
  "/api/*",
  bodyLimit({
    maxSize: 10 * 1024 * 1024,
    onError: (c) => c.json({ error: "request body too large" }, 413),
  })
)

app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowed = process.env.WEB_ORIGIN
      return allowed && origin === allowed ? origin : null
    },
    credentials: true,
    allowHeaders: ["content-type", "authorization"],
    exposeHeaders: ["X-Session-Id"],
  })
)

// Better Auth handles its own routes — mounted before the auth gate.
app.all("/api/auth/*", (c) => auth.handler(c.req.raw))

app.use("*", authContext)

app.onError(errorHandler)

app.get("/health", (c) => c.json({ ok: true }))

const api = new Hono<AppEnv>()
api.route("/notebooks", notebooks)
api.route("/shelves", shelves)
api.route("/me", me)
api.route("/onboarding", onboarding)
api.route("/generate-course", generateCourse)
api.route("/chapters", chapters)
api.route("/flashcards", flashcards)
api.route("/quizzes", quizzes)
api.route("/mindmaps", mindmaps)
api.route("/exams", exams)
api.route("/sources", sources)
api.route("/podcasts", podcasts)
api.route("/chat/sessions", chatSessions)
api.use("/llm-test/*", requireAdmin)
api.route("/llm-test", llmTest)
api.use("/admin/*", requireAdmin)
api.route("/admin", admin)
api.route("/admin/content", content)
api.route("/archive", archive)
api.route("/billing", billing)
api.route("/feedback", feedback)
api.route("/discount", discount)

app.route("/api", api)

if (process.env.ENABLE_FILE_WORKER !== "0") {
  try {
    startFileProcessWorker()
  } catch (err) {
    console.warn(
      "[file-worker] not started:",
      err instanceof Error ? err.message : err
    )
  }
}

if (process.env.ENABLE_EMBED_WORKER !== "false") {
  try {
    startSourceEmbedWorker()
  } catch (err) {
    console.warn(
      "[embed-worker] not started:",
      err instanceof Error ? err.message : err
    )
  }
}

if (process.env.ENABLE_URL_INGEST_WORKER !== "0") {
  try {
    startUrlIngestWorker()
  } catch (err) {
    console.warn(
      "[url-ingest] not started:",
      err instanceof Error ? err.message : err
    )
  }
}

if (process.env.ENABLE_PODCAST_WORKER !== "0") {
  try {
    startPodcastWorker()
  } catch (err) {
    console.warn(
      "[podcast-worker] not started:",
      err instanceof Error ? err.message : err
    )
  }
}

export default {
  port: Number(process.env.PORT ?? 3001),
  fetch: app.fetch,
  // OAuth token exchange (e.g. Google sign-in) can take longer than Bun's
  // default 10s idle timeout when the server has high latency to the provider.
  // Without this, the callback request is killed mid-exchange and the
  // one-time code becomes invalid → `invalid_grant`.
  idleTimeout: 120,
}
