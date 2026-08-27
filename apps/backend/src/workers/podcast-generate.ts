import { promises as fs } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomBytes } from "node:crypto"

import { eq, sql } from "drizzle-orm"
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg"
import ffprobeInstaller from "@ffprobe-installer/ffprobe"
import ffmpeg from "fluent-ffmpeg"

import { db } from "@workspace/db"
import { notebooks, podcasts } from "@workspace/db/schema"
import type { KokoroVoiceId, PodcastScriptTurn } from "@workspace/types"

import { aggregateSourceContent } from "../lib/ai/generate"
import { generatePodcastScript } from "../lib/ai/podcast-script"
import { discordLogger } from "../lib/logger/discord"
import {
  createPodcastWorker,
  type PodcastJobData,
} from "../lib/queue/podcast"
import {
  checkQuotaForUser,
  recordQuotaUsage,
  requireProForPodcast,
} from "../lib/quota"
import { buildStorageKey, deleteObject, uploadObject } from "../lib/storage/r2"
import { synthesizeSpeech } from "../lib/tts/kokoro"
import { getUserAndPlanForNotebook } from "../lib/user-plan"

ffmpeg.setFfmpegPath(ffmpegInstaller.path)
ffmpeg.setFfprobePath(ffprobeInstaller.path)

// 4 concurrent TTS requests keeps wall-time low without flooding the provider.
const TTS_CONCURRENCY = Number(process.env.PODCAST_TTS_CONCURRENCY ?? "4")

async function ttsTurnsParallel(args: {
  turns: PodcastScriptTurn[]
  voicePrimary: KokoroVoiceId
  voiceSecondary: KokoroVoiceId
  outDir: string
  concurrency: number
}): Promise<string[]> {
  const { turns, voicePrimary, voiceSecondary, outDir, concurrency } = args
  const files = new Array<string>(turns.length)
  let next = 0
  const workers = Array.from(
    { length: Math.min(concurrency, turns.length) },
    async () => {
      while (true) {
        const i = next++
        if (i >= turns.length) return
        const turn = turns[i]!
        const voice =
          turn.speaker === "host" ? voicePrimary : voiceSecondary
        const buf = await synthesizeSpeech({ text: turn.text, voice })
        const path = join(outDir, `turn-${String(i).padStart(4, "0")}.mp3`)
        await fs.writeFile(path, buf)
        files[i] = path
      }
    },
  )
  await Promise.all(workers)
  return files
}

async function concatMp3s(inputs: string[], outputPath: string): Promise<void> {
  // Use the concat demuxer with re-encode (not -c copy) so any minor format
  // drift across TTS responses doesn't produce silent gaps or clicks.
  const listPath = `${outputPath}.list.txt`
  // Quote each path so spaces / special chars don't break the demuxer parser.
  const listBody = inputs
    .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
    .join("\n")
  await fs.writeFile(listPath, listBody)
  await new Promise<void>((resolve, reject) => {
    ffmpeg(listPath)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .audioCodec("libmp3lame")
      .audioBitrate("96k")
      .audioChannels(1)
      .format("mp3")
      .on("error", reject)
      .on("end", () => resolve())
      .save(outputPath)
  })
}

function parseDurationTag(value: string | undefined): number {
  if (!value) return 0
  const parts = value.trim().split(":")
  if (parts.length === 3) {
    const h = Number(parts[0])
    const m = Number(parts[1])
    const s = Number(parts[2])
    if (!Number.isFinite(h) || !Number.isFinite(m) || !Number.isFinite(s)) return 0
    return h * 3600 + m * 60 + s
  }
  const f = Number.parseFloat(value)
  return Number.isFinite(f) ? f : 0
}

async function probeDurationSec(path: string): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(path, (err, data) => {
      if (err) return reject(err)

      let d = data?.format?.duration
      if (typeof d === "number" && Number.isFinite(d) && d > 0) {
        return resolve(d)
      }

      const streamDuration = data?.streams?.[0]?.duration
      if (
        typeof streamDuration === "number" &&
        Number.isFinite(streamDuration) &&
        streamDuration > 0
      ) {
        return resolve(streamDuration)
      }

      const tagDuration = parseDurationTag(data?.format?.tags?.DURATION as string | undefined)
      if (tagDuration > 0) return resolve(tagDuration)

      const fileSize = data?.format?.size
      const bitRate = data?.format?.bit_rate
      if (
        typeof fileSize === "number" &&
        typeof bitRate === "number" &&
        bitRate > 0
      ) {
        d = (fileSize * 8) / bitRate
        if (Number.isFinite(d) && d > 0) return resolve(d)
      }

      return reject(new Error("ffprobe could not determine duration"))
    })
  })
}

async function setStatus(
  podcastId: string,
  patch: {
    status?: "pending" | "generating" | "ready" | "failed"
    audioStorageKey?: string | null
    durationSeconds?: number | null
    errorMessage?: string | null
    scriptJson?: PodcastScriptTurn[] | null
  },
): Promise<void> {
  await db
    .update(podcasts)
    .set({ ...patch, updatedAt: sql`now()` })
    .where(eq(podcasts.id, podcastId))
}

async function processJob(data: PodcastJobData): Promise<void> {
  const { podcastId } = data

  const [row] = await db
    .select()
    .from(podcasts)
    .where(eq(podcasts.id, podcastId))
    .limit(1)
  if (!row) throw new Error(`podcast ${podcastId} not found`)

  const owner = await getUserAndPlanForNotebook(row.notebookId)
  if (!owner) throw new Error(`podcast ${podcastId} has no owner`)

  // Pro-only feature — bail defensively in case a job was enqueued before the
  // route gate existed (or via any bypass). Free users get a clear error row.
  requireProForPodcast(owner.plan)

  // Quota gate before any expensive work — keeps TTS bills bounded for free
  // users even if a credit was already drained between POST and worker pick-up.
  await checkQuotaForUser(owner.userId, owner.plan, "podcast.generate")

  // Replacing an existing audio object — wipe the old one so we don't leak
  // a paid R2 byte every regenerate.
  if (row.audioStorageKey) {
    await deleteObject(row.audioStorageKey).catch((err) => {
      console.warn(
        `[podcast-worker] could not delete prior audio for ${podcastId}:`,
        err instanceof Error ? err.message : err,
      )
    })
  }

  await setStatus(podcastId, {
    status: "generating",
    errorMessage: null,
    audioStorageKey: null,
    durationSeconds: null,
    scriptJson: null,
  })

  // Look up the notebook title once — drives the script gen prompt.
  const [nb] = await db
    .select({ title: notebooks.title, language: notebooks.language })
    .from(notebooks)
    .where(eq(notebooks.id, row.notebookId))
    .limit(1)
  if (!nb) throw new Error(`notebook ${row.notebookId} not found`)

  const { text, count } = await aggregateSourceContent(row.notebookId)
  if (count === 0) {
    throw new Error("No source content available to build a podcast from.")
  }

  const { turns } = await generatePodcastScript({
    title: nb.title,
    content: text,
    language: nb.language,
  })
  if (turns.length === 0) {
    throw new Error("Podcast script came back empty.")
  }

  // Persist the script early — even if TTS fails later, the user can read it
  // and click Try-again without paying a second script-gen credit.
  await setStatus(podcastId, { scriptJson: turns })

  const id = randomBytes(8).toString("hex")
  const dir = join(tmpdir(), `arkive-podcast-${podcastId}-${id}`)
  await fs.mkdir(dir, { recursive: true })

  try {
    const turnFiles = await ttsTurnsParallel({
      turns,
      voicePrimary: row.voicePrimary as KokoroVoiceId,
      voiceSecondary: row.voiceSecondary as KokoroVoiceId,
      outDir: dir,
      concurrency: TTS_CONCURRENCY,
    })

    const finalPath = join(dir, "podcast.mp3")
    await concatMp3s(turnFiles, finalPath)

    const durationSeconds = Math.round(await probeDurationSec(finalPath))
    const audioBuf = await fs.readFile(finalPath)

    const audioStorageKey = buildStorageKey(
      "podcast",
      row.notebookId,
      `${podcastId}.mp3`,
    )
    await uploadObject({
      key: audioStorageKey,
      body: audioBuf,
      contentType: "audio/mpeg",
    })

    await setStatus(podcastId, {
      status: "ready",
      audioStorageKey,
      durationSeconds,
      errorMessage: null,
    })

    // Charge the user only after a successful end-to-end generation, matching
    // the media.transcribe pattern (worker-side recordQuotaUsage).
    await recordQuotaUsage(owner.userId, owner.plan, "podcast.generate")
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

export function startPodcastWorker(): void {
  const worker = createPodcastWorker(async (job) => {
    try {
      await processJob(job.data)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await setStatus(job.data.podcastId, {
        status: "failed",
        errorMessage: message,
      }).catch(() => {})
      throw err
    }
  })

  worker.on("failed", (job, err) => {
    console.error(`[podcast-worker] job ${job?.id} failed:`, err.message)
    discordLogger().error(
      `Podcast worker job failed (${job?.id ?? "?"})`,
      err,
    )
  })
  worker.on("completed", (job) => {
    console.log(
      `[podcast-worker] job ${job.id} completed for podcast ${job.data.podcastId}`,
    )
  })
  console.log("[podcast-worker] started")
}
