export const ACTIONS = [
  "summary.generate",
  "flashcards.generate",
  "quizzes.generate",
  "mindmap.generate",
  "course.generate",
  "chat.message",
  "media.transcribe",
  "podcast.generate",
] as const

export type ActionKey = (typeof ACTIONS)[number]

export const ACTION_LABELS: Record<ActionKey, string> = {
  "summary.generate": "Summary",
  "flashcards.generate": "Flashcard set",
  "quizzes.generate": "Quiz",
  "mindmap.generate": "Mindmap",
  "course.generate": "Course",
  "chat.message": "Chat message",
  "media.transcribe": "Audio / video transcription",
  "podcast.generate": "Podcast",
}

// Credit cost per action. Free users spend from a single shared pool;
// pro users pass through with no deduction. Tweak per action when an
// asymmetry (e.g. transcription cost) needs pricing in.
export const CREDIT_COSTS: Record<ActionKey, number> = {
  "summary.generate": 1,
  "flashcards.generate": 1,
  "quizzes.generate": 1,
  "mindmap.generate": 1,
  "course.generate": 1,
  "chat.message": 1,
  "media.transcribe": 1,
  // 25–30 min of Kokoro TTS plus a long LLM script gen is materially heavier
  // than a text-only artifact; price accordingly so the credit pool stays sane.
  "podcast.generate": 3,
}

// Credits granted on first encounter with a free user. Topped up via
// promo flows (e.g. /free-credits TikTok submissions).
export const FREE_STARTER_CREDITS = 5

export function creditCost(action: ActionKey): number {
  return CREDIT_COSTS[action]
}

export type CreditState = {
  balance: number
  lifetimeGranted: number
  lifetimeConsumed: number
  starterAmount: number
}
