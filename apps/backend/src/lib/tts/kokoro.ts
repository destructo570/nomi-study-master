import type { KokoroVoiceId } from "@workspace/types"

// Single chokepoint for TTS. The whole "we use OpenRouter + Kokoro" decision
// is contained in this file — if OpenRouter doesn't actually serve Kokoro,
// the swap to Replicate / HuggingFace / self-hosted is a single-file change
// and nothing downstream needs to know.

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"

export class KokoroTtsError extends Error {
  status: number | null
  responseBody: string | null
  constructor(message: string, opts?: { status?: number; body?: string }) {
    super(message)
    this.name = "KokoroTtsError"
    this.status = opts?.status ?? null
    this.responseBody = opts?.body ?? null
  }
}

function config(): {
  baseUrl: string
  apiKey: string
  model: string
} {
  const apiKey = process.env.OPENROUTER_API_KEY
  const model = process.env.KOKORO_MODEL_ID
  if (!apiKey) throw new KokoroTtsError("OPENROUTER_API_KEY is not set")
  if (!model) throw new KokoroTtsError("KOKORO_MODEL_ID is not set")
  const baseUrl = (process.env.OPENROUTER_BASE_URL ?? DEFAULT_BASE_URL).replace(
    /\/+$/,
    "",
  )
  return { baseUrl, apiKey, model }
}

export async function synthesizeSpeech(args: {
  text: string
  voice: KokoroVoiceId
}): Promise<Buffer> {
  const { baseUrl, apiKey, model } = config()
  const res = await fetch(`${baseUrl}/audio/speech`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      voice: args.voice,
      input: args.text,
      response_format: "mp3",
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new KokoroTtsError(
      `Kokoro TTS failed (${res.status}): ${body.slice(0, 500)}`,
      { status: res.status, body },
    )
  }
  const bytes = new Uint8Array(await res.arrayBuffer())
  return Buffer.from(bytes)
}
