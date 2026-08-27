import { embedMany } from "ai"
import { openai } from "@ai-sdk/openai"

import { discordLogger } from "../logger/discord"

const EMBED_MODEL = process.env.EMBED_MODEL || "text-embedding-3-small"
const BATCH_SIZE = 64

export const EMBED_DIMENSIONS = 1536

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set")
  }

  const out: number[][] = []
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    try {
      const { embeddings } = await embedMany({
        model: openai.embedding(EMBED_MODEL),
        values: batch,
      })
      for (const e of embeddings) out.push(e as number[])
    } catch (err) {
      discordLogger().openaiError({
        operation: "embedMany",
        error: err,
        context: {
          model: EMBED_MODEL,
          batchSize: batch.length,
          batchIndex: Math.floor(i / BATCH_SIZE),
        },
      })
      throw err
    }
  }
  return out
}
