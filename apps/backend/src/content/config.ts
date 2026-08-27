/**
 * Generation config: model id, token caps, variation presets, the model
 * factory hook (so multi-model generation is pluggable without touching the
 * generator).
 */
import { openai } from "@ai-sdk/openai"
import type { LanguageModel } from "ai"

import type { ContentType } from "./schemas"

export const MODEL_ID = process.env.CONTENT_MODEL_ID ?? "gpt-4o"

/** Output-token cap. Article-length generation needs real headroom; tuned to
 * the largest legitimate article (a heavy comparison/tutorial ~1500 words ≈
 * 4k tokens) plus structural overhead. */
export const MAX_TOKENS_CONTENT = 6000

/**
 * Variation presets — distinct temperatures nudge the model to different
 * framings of the same outline. Keep the count ≤ 3 (the schema caps it).
 * Clear with `--no-variations`-style request: variations=1 uses [0].
 */
export const VARIATION_PRESETS = [
  { label: "A", temperature: 0.4 },
  { label: "B", temperature: 0.7 },
  { label: "C", temperature: 0.95 },
] as const

/**
 * Pluggable model factory. Default: OpenAI via @ai-sdk/openai (the SDK
 * already used in this repo). Swap to any LanguageModel to enable
 * multi-model generation without touching the generator.
 */
export let modelFactory: (modelId: string) => LanguageModel = (id) =>
  openai(id)

/** Test hook: override the model (e.g. mocked provider) without monkeypatching. */
export function setModelFactory(fn: (modelId: string) => LanguageModel): void {
  modelFactory = fn
}

export const model = (): LanguageModel => modelFactory(MODEL_ID)

/** Content types the web currently renders pages for (already-supported). */
export const PERSISTABLE_TYPES: ContentType[] = [
  "feature",
  "blog",
  "alternative",
  "comparison",
  "tutorial",
  "faq",
  "landing",
]