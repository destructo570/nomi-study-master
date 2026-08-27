// YouTube transcript via transcriptapi.com.
//
// Captions-only path: returns plain transcript text + metadata. We don't
// fall back to audio download + Whisper — videos without captions surface
// `YoutubeNoCaptionsError`, and the route turns that into a "no captions
// available" status on the source row.

const TRANSCRIPT_ENDPOINT = "https://transcriptapi.com/api/v2/youtube/transcript"

export class YoutubeNoCaptionsError extends Error {
  constructor() {
    super("This video has no captions available.")
    this.name = "YoutubeNoCaptionsError"
  }
}

export class YoutubeFetchError extends Error {
  status: number
  constructor(status: number, detail: string) {
    super(detail)
    this.name = "YoutubeFetchError"
    this.status = status
  }
}

export type YoutubeTranscriptResult = {
  videoId: string
  language: string
  text: string
  title: string | null
  authorName: string | null
  authorUrl: string | null
  thumbnailUrl: string | null
}

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/

// Recognise the common public YouTube URL shapes. Anything else (live,
// playlist-only, channel) we treat as not-a-video and reject.
export function parseYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim()
  if (VIDEO_ID_RE.test(trimmed)) return trimmed
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }
  const host = url.hostname.replace(/^www\./, "")
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0] ?? ""
    return VIDEO_ID_RE.test(id) ? id : null
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      const v = url.searchParams.get("v") ?? ""
      return VIDEO_ID_RE.test(v) ? v : null
    }
    const m = url.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/)
    if (m && VIDEO_ID_RE.test(m[1]!)) return m[1]!
  }
  return null
}

export function isYoutubeUrl(input: string): boolean {
  return parseYoutubeVideoId(input) !== null
}

const MAX_ATTEMPTS = 3

export async function fetchYoutubeTranscript(
  videoIdOrUrl: string,
): Promise<YoutubeTranscriptResult> {
  const apiKey = process.env.TRANSCRIPTAPI_KEY
  if (!apiKey) throw new Error("TRANSCRIPTAPI_KEY not set")

  const videoId = parseYoutubeVideoId(videoIdOrUrl)
  if (!videoId) throw new YoutubeFetchError(422, "Invalid YouTube URL or video ID")

  const url = new URL(TRANSCRIPT_ENDPOINT)
  url.searchParams.set("video_url", videoId)
  url.searchParams.set("format", "text")
  url.searchParams.set("include_timestamp", "false")
  url.searchParams.set("send_metadata", "true")

  let attempt = 0
  let lastErr: unknown
  while (attempt < MAX_ATTEMPTS) {
    attempt++
    let res: Response
    try {
      res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      })
    } catch (err) {
      lastErr = err
      await sleep(backoffDelayMs(attempt))
      continue
    }

    if (res.status === 200) {
      const json = (await res.json()) as TranscriptApiResponse
      const text = typeof json.transcript === "string" ? json.transcript.trim() : ""
      if (!text) throw new YoutubeNoCaptionsError()
      let title = json.metadata?.title ?? null
      let authorName = json.metadata?.author_name ?? null
      let authorUrl = json.metadata?.author_url ?? null
      let thumbnailUrl = json.metadata?.thumbnail_url ?? null
      // transcriptapi sometimes returns metadata: null (videos with
      // captions but no oEmbed data exposed). Fall back to YouTube's
      // public oEmbed endpoint so we can still surface a real title.
      if (!title) {
        const fallback = await fetchYoutubeOembed(json.video_id)
        if (fallback) {
          title = fallback.title
          authorName ??= fallback.authorName
          authorUrl ??= fallback.authorUrl
          thumbnailUrl ??= fallback.thumbnailUrl
        }
      }
      return {
        videoId: json.video_id,
        language: json.language,
        text,
        title,
        authorName,
        authorUrl,
        thumbnailUrl,
      }
    }

    if (res.status === 404) {
      throw new YoutubeNoCaptionsError()
    }

    // Retryable transient failures: 408 (bot detection), 429 (rate limit),
    // 503 (service warming up). Honour Retry-After when present.
    if (res.status === 408 || res.status === 429 || res.status === 503) {
      const retryAfter = Number(res.headers.get("retry-after"))
      const delay = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : backoffDelayMs(attempt)
      lastErr = new YoutubeFetchError(res.status, await safeReadDetail(res))
      if (attempt >= MAX_ATTEMPTS) break
      await sleep(delay)
      continue
    }

    throw new YoutubeFetchError(res.status, await safeReadDetail(res))
  }

  if (lastErr instanceof Error) throw lastErr
  throw new YoutubeFetchError(0, "transcriptapi: exhausted retries")
}

type TranscriptApiResponse = {
  video_id: string
  language: string
  transcript: string | unknown
  metadata?: {
    title?: string | null
    author_name?: string | null
    author_url?: string | null
    thumbnail_url?: string | null
  } | null
}

function backoffDelayMs(attempt: number): number {
  return Math.min(5000, 1000 * 2 ** (attempt - 1))
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function safeReadDetail(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { detail?: unknown }
    if (typeof j.detail === "string") return j.detail
    return `transcriptapi ${res.status}`
  } catch {
    return `transcriptapi ${res.status}`
  }
}

type YoutubeOembedFallback = {
  title: string
  authorName: string | null
  authorUrl: string | null
  thumbnailUrl: string | null
}

async function fetchYoutubeOembed(
  videoId: string,
): Promise<YoutubeOembedFallback | null> {
  const url = new URL("https://www.youtube.com/oembed")
  url.searchParams.set("url", `https://www.youtube.com/watch?v=${videoId}`)
  url.searchParams.set("format", "json")
  try {
    const res = await fetch(url, { method: "GET" })
    if (!res.ok) return null
    const json = (await res.json()) as {
      title?: string | null
      author_name?: string | null
      author_url?: string | null
      thumbnail_url?: string | null
    }
    const title = json.title?.trim()
    if (!title) return null
    return {
      title,
      authorName: json.author_name ?? null,
      authorUrl: json.author_url ?? null,
      thumbnailUrl: json.thumbnail_url ?? null,
    }
  } catch {
    return null
  }
}
