import { Hono } from "hono"
import { and, eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { z } from "zod"

import { db } from "@workspace/db"
import { podcasts } from "@workspace/db/schema"
import { toPodcast } from "@workspace/db/serialize"
import { KOKORO_VOICES, isKokoroVoiceId } from "@workspace/types"

import type { AppEnv } from "../types"
import type { Plan } from "@workspace/types"
import { requireOwnedNotebook } from "../lib/ownership"
import { checkQuota, requireProForPodcast } from "../lib/quota"
import { getPodcastQueue } from "../lib/queue/podcast"
import {
  createPresignedDownloadUrl,
  deleteObject,
} from "../lib/storage/r2"

const router = new Hono<AppEnv>()

const generateSchema = z
  .object({
    notebookId: z.string().min(1),
    voicePrimary: z.string().min(1),
    voiceSecondary: z.string().min(1),
  })
  .refine((v) => isKokoroVoiceId(v.voicePrimary), {
    message: "voicePrimary is not a supported Kokoro voice",
    path: ["voicePrimary"],
  })
  .refine((v) => isKokoroVoiceId(v.voiceSecondary), {
    message: "voiceSecondary is not a supported Kokoro voice",
    path: ["voiceSecondary"],
  })
  .refine((v) => v.voicePrimary !== v.voiceSecondary, {
    message: "Host and guest voices must be different",
    path: ["voiceSecondary"],
  })

/* GET /api/podcasts/voices — static catalog, drives the UI picker. */
router.get("/voices", (c) => {
  return c.json({ voices: KOKORO_VOICES })
})

/* GET /api/podcasts?notebookId=... — latest podcast for a notebook (or null). */
router.get("/", async (c) => {
  const notebookId = c.req.query("notebookId")
  if (!notebookId) return c.json({ error: "notebookId required" }, 400)
  await requireOwnedNotebook(c.get("userId"), notebookId)
  const [row] = await db
    .select()
    .from(podcasts)
    .where(eq(podcasts.notebookId, notebookId))
    .limit(1)
  return c.json(row ? toPodcast(row) : null)
})

/* POST /api/podcasts — generate (or regenerate) a notebook's podcast. */
router.post("/", async (c) => {
  const body = generateSchema.parse(await c.req.json())
  await requireOwnedNotebook(c.get("userId"), body.notebookId)

  // Podcasts are a Pro-only feature — free users are routed to upgrade.
  requireProForPodcast(c.get("userPlan") as Plan)

  // Pre-check credits so free users without balance bounce before we enqueue
  // any work. Final deduction happens in the worker on success.
  await checkQuota(c, "podcast.generate")

  const [existing] = await db
    .select()
    .from(podcasts)
    .where(eq(podcasts.notebookId, body.notebookId))
    .limit(1)

  let row
  if (existing) {
    // Regenerate path — keep the row, reset its fields, and let the worker
    // wipe the prior R2 object once it picks the job up.
    ;[row] = await db
      .update(podcasts)
      .set({
        status: "pending",
        voicePrimary: body.voicePrimary,
        voiceSecondary: body.voiceSecondary,
        errorMessage: null,
        scriptJson: null,
        durationSeconds: null,
      })
      .where(eq(podcasts.id, existing.id))
      .returning()
  } else {
    ;[row] = await db
      .insert(podcasts)
      .values({
        id: nanoid(10),
        notebookId: body.notebookId,
        status: "pending",
        voicePrimary: body.voicePrimary,
        voiceSecondary: body.voiceSecondary,
      })
      .returning()
  }
  if (!row) return c.json({ error: "Failed to create podcast" }, 500)

  await getPodcastQueue().add(
    "generate",
    { podcastId: row.id },
    { jobId: `podcast-${row.id}-${Date.now()}` },
  )

  return c.json(toPodcast(row))
})

/* GET /api/podcasts/:id/audio — fresh signed download URL for the MP3. */
router.get("/:id/audio", async (c) => {
  const id = c.req.param("id")
  const userId = c.get("userId")
  const [row] = await db
    .select()
    .from(podcasts)
    .where(eq(podcasts.id, id))
    .limit(1)
  if (!row) return c.json({ error: "Podcast not found" }, 404)
  // Ownership check via notebook join.
  await requireOwnedNotebook(userId, row.notebookId)
  if (row.status !== "ready" || !row.audioStorageKey) {
    return c.json({ error: "Podcast not ready" }, 409)
  }
  const { url } = await createPresignedDownloadUrl({ key: row.audioStorageKey })
  return c.json({ url })
})

/* DELETE /api/podcasts/:id — remove row + R2 object. */
router.delete("/:id", async (c) => {
  const id = c.req.param("id")
  const userId = c.get("userId")
  const [row] = await db
    .select()
    .from(podcasts)
    .where(eq(podcasts.id, id))
    .limit(1)
  if (!row) return c.json({ ok: true })
  await requireOwnedNotebook(userId, row.notebookId)
  if (row.audioStorageKey) {
    await deleteObject(row.audioStorageKey).catch(() => {})
  }
  await db.delete(podcasts).where(eq(podcasts.id, id))
  return c.json({ ok: true })
})

export default router
