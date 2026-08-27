import { createReadStream, promises as fs } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomBytes } from "node:crypto"

import ffmpegInstaller from "@ffmpeg-installer/ffmpeg"
import ffprobeInstaller from "@ffprobe-installer/ffprobe"
import ffmpeg from "fluent-ffmpeg"
import OpenAI from "openai"

import { discordLogger } from "../logger/discord"

ffmpeg.setFfmpegPath(ffmpegInstaller.path)
ffmpeg.setFfprobePath(ffprobeInstaller.path)

export class MediaTooLongError extends Error {
  durationSec: number
  limitSec: number
  constructor(durationSec: number, limitSec: number) {
    super(
      `Audio/video duration ${Math.round(durationSec)}s exceeds the ${Math.round(limitSec)}s limit for this plan.`,
    )
    this.name = "MediaTooLongError"
    this.durationSec = durationSec
    this.limitSec = limitSec
  }
}

const TRANSCRIBE_MODEL = process.env.TRANSCRIBE_MODEL ?? "gpt-4o-mini-transcribe"

const AUDIO_BITRATE_KBPS = 64
// Hard cap each chunk at 4 minutes of (post-speedup) audio.
const CHUNK_DURATION_SEC = 4 * 60
// Number of chunks transcribed in parallel against OpenAI.
const TRANSCRIBE_CONCURRENCY = 2

let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (openaiClient) return openaiClient
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY not set")
  openaiClient = new OpenAI({ apiKey })
  return openaiClient
}

function inputExtensionFromMime(mime: string): string {
  if (mime === "audio/mpeg") return "mp3"
  if (mime === "audio/mp4") return "m4a"
  if (mime === "audio/aac") return "aac"
  if (mime === "video/mp4") return "mp4"
  if (mime === "audio/webm" || mime.startsWith("audio/webm")) return "webm"
  if (mime === "audio/ogg" || mime.startsWith("audio/ogg")) return "ogg"
  return "bin"
}

async function spedUpMp3(inputPath: string, outputPath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioFilters("atempo=2.0")
      .audioCodec("libmp3lame")
      .audioBitrate(`${AUDIO_BITRATE_KBPS}k`)
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

async function probeDurationSec(inputPath: string): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, data) => {
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

      resolve(0)
    })
  })
}

async function splitIntoChunks(
  inputPath: string,
  outDir: string,
): Promise<string[]> {
  const pattern = join(outDir, "chunk-%03d.mp3")
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        "-f",
        "segment",
        "-segment_time",
        String(CHUNK_DURATION_SEC),
        "-reset_timestamps",
        "1",
        "-c",
        "copy",
      ])
      .on("error", reject)
      .on("end", () => resolve())
      .save(pattern)
  })
  const files = (await fs.readdir(outDir))
    .filter((f) => f.startsWith("chunk-") && f.endsWith(".mp3"))
    .sort()
  return files.map((f) => join(outDir, f))
}

async function transcribeFile(path: string): Promise<string> {
  try {
    const res = await getOpenAI().audio.transcriptions.create({
      model: TRANSCRIBE_MODEL,
      file: createReadStream(path),
    })
    return res.text.trim()
  } catch (err) {
    discordLogger().openaiError({
      operation: "audio.transcriptions.create",
      error: err,
      context: { model: TRANSCRIBE_MODEL, file: path.split("/").pop() ?? path },
    })
    throw err
  }
}

async function transcribeChunksParallel(
  chunks: string[],
  concurrency: number,
): Promise<string[]> {
  const results = new Array<string>(chunks.length)
  let next = 0
  const workers = Array.from(
    { length: Math.min(concurrency, chunks.length) },
    async () => {
      while (true) {
        const i = next++
        if (i >= chunks.length) return
        results[i] = await transcribeFile(chunks[i]!)
      }
    },
  )
  await Promise.all(workers)
  return results
}

export async function extractMediaText(args: {
  buffer: Buffer
  mimeType: string
  sourceId?: string
  fileName?: string | null
  /** Original-audio duration cap in seconds. Probed BEFORE the heavy 2x
   *  speedup transcode so we reject cheaply for over-limit uploads. */
  maxDurationSec?: number
}): Promise<{ text: string; chunkCount: number; originalDurationSec: number }> {
  const id = randomBytes(8).toString("hex")
  const dir = join(tmpdir(), `arkive-${id}`)
  await fs.mkdir(dir, { recursive: true })
  const inputPath = join(dir, `in.${inputExtensionFromMime(args.mimeType)}`)
  const compressedPath = join(dir, "out.mp3")
  try {
    await fs.writeFile(inputPath, args.buffer)

    const originalDurationSec = await probeDurationSec(inputPath)
    if (
      typeof args.maxDurationSec === "number" &&
      originalDurationSec > 0 &&
      originalDurationSec > args.maxDurationSec
    ) {
      throw new MediaTooLongError(originalDurationSec, args.maxDurationSec)
    }

    await spedUpMp3(inputPath, compressedPath)

    const durationSec = await probeDurationSec(compressedPath)

    if (durationSec <= 0 || durationSec <= CHUNK_DURATION_SEC) {
      if (args.sourceId) {
        discordLogger().transcriptionChunkPlan({
          sourceId: args.sourceId,
          chunkCount: 1,
          chunkDurationSec: CHUNK_DURATION_SEC,
          concurrency: 1,
        })
      }
      const text = await transcribeFile(compressedPath)
      return { text, chunkCount: 1, originalDurationSec }
    }

    const chunksDir = join(dir, "chunks")
    await fs.mkdir(chunksDir, { recursive: true })
    const chunks = await splitIntoChunks(compressedPath, chunksDir)
    if (chunks.length === 0) {
      throw new Error("ffmpeg segment produced no chunks")
    }

    if (args.sourceId) {
      discordLogger().transcriptionChunkPlan({
        sourceId: args.sourceId,
        chunkCount: chunks.length,
        chunkDurationSec: CHUNK_DURATION_SEC,
        concurrency: TRANSCRIBE_CONCURRENCY,
      })
    }

    const parts = await transcribeChunksParallel(chunks, TRANSCRIBE_CONCURRENCY)
    return {
      text: parts.filter(Boolean).join("\n\n"),
      chunkCount: chunks.length,
      originalDurationSec,
    }
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}
