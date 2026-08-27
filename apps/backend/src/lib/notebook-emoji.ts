const EMOJI_POOL = [
  "📓", "📔", "📒", "📕", "📗", "📘", "📙",
  "🧠", "💡", "🔬", "🧪", "🔎", "🗺️", "🚀",
  "📚", "✍️", "📝", "🎯", "⭐", "🔖", "📌",
]

export function pickNotebookEmoji(seed?: string): string {
  if (!seed) return EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  return EMOJI_POOL[Math.abs(hash) % EMOJI_POOL.length]!
}
