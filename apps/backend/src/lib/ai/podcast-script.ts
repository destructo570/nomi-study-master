import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

import type { PodcastScriptTurn } from "@workspace/types"
import { getLanguage } from "@workspace/types/language"

import { discordLogger } from "../logger/discord"

const MODEL_ID = "gpt-4o-mini"

// Source-content budget. Doubled vs. the standard 12k cap in generate.ts —
// podcasts thrive on breadth, and we want the model to have room to choose
// the most engaging beats from a long source rather than truncate mid-thought.
const MAX_CONTEXT_CHARS = 24_000

// Output cap. 4400 words ≈ 6000 tokens of script; plus JSON overhead for
// turn boundaries, ~8000 leaves comfortable headroom.
const MAX_OUTPUT_TOKENS = 8_000

const turnSchema = z.object({
  speaker: z.enum(["host", "guest"]),
  text: z.string().min(1),
})

const scriptSchema = z.object({
  turns: z.array(turnSchema).min(20).max(200),
})

export type PodcastScriptArgs = {
  title: string
  content: string
  language?: string | null
}

function clamp(text: string, limit = MAX_CONTEXT_CHARS): string {
  return text.length > limit ? text.slice(0, limit) : text
}

function hasApiKey(): boolean {
  return !!process.env.OPENAI_API_KEY
}

function mockScript(args: PodcastScriptArgs): PodcastScriptTurn[] {
  // Tiny placeholder — surfaces when OPENAI_API_KEY isn't set so the rest of
  // the pipeline (queue, TTS, R2 upload, UI) can be exercised end-to-end.
  return [
    {
      speaker: "host",
      text: `Welcome back to the show! Today we're digging into ${args.title}. I have to say — I'd been looking forward to this one all week.`,
    },
    {
      speaker: "guest",
      text:
        "Oh, thanks for having me. It's a meaty topic, but I think we can make it click. Where do you want to start?",
    },
    {
      speaker: "host",
      text:
        "Let's start at the very beginning. For someone who has never heard of this — give me the one-sentence pitch.",
    },
    {
      speaker: "guest",
      text:
        "Right. So at its core, it's about a few simple ideas that combine in surprising ways. But — and this is the fun part — the simplicity is what makes it powerful.",
    },
    {
      speaker: "host",
      text:
        "Hmm. Okay. So [mock] this is a sample script because OPENAI_API_KEY isn't set in the environment. Wire it up to hear the real conversation.",
    },
    {
      speaker: "guest",
      text:
        "Exactly. And on that note — that's a great place to leave it for today. Thanks for tuning in!",
    },
  ]
}

const SYSTEM_PROMPT = [
  "You are a podcast scriptwriter producing a two-voice dialogue between HOST and GUEST.",
  "HOST is curious, sharp, and drives the conversation forward with natural reactions and follow-up questions. GUEST is the subject-matter expert who explains ideas clearly, gives examples, and occasionally surprises HOST with a counter-intuitive insight or unexpected twist.",
  "",
  "STRUCTURE:",
  "• Open with a strong hook — HOST should tease the topic in a way that creates immediate curiosity.",
  "• Build through 4–6 thematic beats. Each beat should introduce an idea, explore it through examples or tension, and land a takeaway before moving forward.",
  "• The conversation should evolve emotionally — curiosity, skepticism, surprise, tension, realization, clarity.",
  "• Close with a short wrap-up that distills the single most important thing the listener should remember.",
  "",
  "LENGTH:",
  "• Target 3800–4400 words total across all turns — roughly 25–28 minutes at 150 words per minute.",
  "• If the source material is dense, prioritize only the most important ideas — do not attempt to cover everything.",
  "• If the source is thin, expand using analogies, hypothetical scenarios, concrete examples, and conversational exploration — but do not fabricate factual claims, statistics, or events unsupported by the source.",
  "• Most turns should stay concise and conversational, but occasional longer responses are allowed when explaining something complex or telling a story.",
  "",
  "CONVERSATIONAL DYNAMICS:",
  "• The rhythm should feel like real spoken conversation, not an interview transcript or essay.",
  "• Allow occasional interruptions, unfinished thoughts, quick reactions, and natural conversational pivots.",
  "• HOST should guide and interrupt naturally, but GUEST usually carries more informational density.",
  "• Avoid repetitive agreement loops. Do not repeatedly restate the same insight in different wording.",
  "• Every beat should introduce new information, tension, perspective, or realization.",
  "",
  "PROSODY (MOST IMPORTANT):",
  "The TTS engine has NO emotion tags or stage directions. Emotion and pacing must come entirely from punctuation, rhythm, and wording.",
  "",
  "Use these tools naturally and liberally:",
  "• Em-dashes (—) for interruptions, pivots, and thought-breaks.",
  "• Ellipses (…) for hesitation, trailing thoughts, or dramatic pauses before reveals.",
  "• Commas to shape breathing and natural pacing.",
  "• Question marks for genuine curiosity.",
  "• Exclamation marks only for real surprise or emphasis — use sparingly.",
  "• Occasional ALL-CAPS on ONE important word for emphasis, at most once or twice per script.",
  "• Natural interjections like 'wait', 'right', 'okay', 'hmm', 'so', 'oh'.",
  "• Contractions everywhere — written speech should sound spoken, not formal.",
  "• Deliberately vary sentence length. Mix very short reactions with longer flowing explanations.",
  "",
  "TTS OPTIMIZATION:",
  "• Write for the ear, not the eye.",
  "• Sentences should be easy to follow when heard once.",
  "• Avoid dense phrasing, stacked jargon, corporate language, or essay-style transitions.",
  "• Prefer clean spoken phrasing over grammatically perfect prose.",
  "• Avoid abbreviations, symbols, or formatting that may sound awkward when read aloud.",
  "",
  "DON'TS:",
  "• Don't open with 'Welcome to the podcast'.",
  "• Don't close with 'Thanks for listening'.",
  "• Don't use stage directions like *laughs* or [pause] — TTS reads them literally.",
  "• Don't use filler phrases like 'great question', 'that's a really good point', or 'absolutely'.",
  "• Don't make the dialogue overly polished — small imperfections make it sound more human.",
  "• Don't include speaker labels like 'HOST:' or 'GUEST:' inside the text field.",
].join("\n")

export async function generatePodcastScript(
  args: PodcastScriptArgs,
): Promise<{ turns: PodcastScriptTurn[] }> {
  if (!hasApiKey() || !args.content.trim()) {
    return { turns: mockScript(args) }
  }
  const language = getLanguage(args.language).name
  const userPrompt = [
    `OUTPUT LANGUAGE: ${language}. Write every word of every turn in ${language}. The source below may be in another language — translate and adapt rather than quoting verbatim.`,
    "",
    `Topic title: ${args.title}`,
    "",
    "Source content (use this as the factual ground for the conversation — do not invent claims it doesn't support):",
    clamp(args.content),
  ].join("\n")
  try {
    const { object } = await generateObject({
      model: openai(MODEL_ID),
      schema: scriptSchema,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    })
    return { turns: object.turns }
  } catch (err) {
    console.error("[ai/podcast-script] generation failed:", err)
    discordLogger().openaiError({
      operation: "generate.podcastScript",
      error: err,
      context: { model: MODEL_ID, title: args.title },
    })
    throw err
  }
}
