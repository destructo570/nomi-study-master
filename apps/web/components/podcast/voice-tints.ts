import type { KokoroVoiceId } from "@workspace/types"

// Saturated tints for the small avatar circles in the voice picker.
export const VOICE_AVATAR_TINT: Record<KokoroVoiceId, string> = {
  af_bella: "bg-[#fce7f3] text-[#9d174d]",
  af_nicole: "bg-[#ede9fe] text-[#5b21b6]",
  af_sky: "bg-[#cffafe] text-[#155e75]",
  am_michael: "bg-[#dbeafe] text-[#1e40af]",
  bf_emma: "bg-[#fef3c7] text-[#92400e]",
  bf_isabella: "bg-[#ffe4e6] text-[#9f1239]",
  bm_george: "bg-[#e5e7eb] text-[#111827]",
  bm_lewis: "bg-[#d1fae5] text-[#065f46]",
}

// Softer tints for larger surfaces (transcript bubbles). Lower bg opacity
// keeps the page readable when 50+ turns stack vertically.
export const VOICE_BUBBLE_BG: Record<KokoroVoiceId, string> = {
  af_bella: "bg-[#fce7f3]/40",
  af_nicole: "bg-[#ede9fe]/40",
  af_sky: "bg-[#cffafe]/40",
  am_michael: "bg-[#dbeafe]/40",
  bf_emma: "bg-[#fef3c7]/40",
  bf_isabella: "bg-[#ffe4e6]/40",
  bm_george: "bg-[#e5e7eb]/60",
  bm_lewis: "bg-[#d1fae5]/40",
}

// Saturated label color paired with each bubble bg - used for the small
// speaker name above each turn so the eye can scan host vs. guest fast.
export const VOICE_LABEL_COLOR: Record<KokoroVoiceId, string> = {
  af_bella: "text-[#9d174d]",
  af_nicole: "text-[#5b21b6]",
  af_sky: "text-[#155e75]",
  am_michael: "text-[#1e40af]",
  bf_emma: "text-[#92400e]",
  bf_isabella: "text-[#9f1239]",
  bm_george: "text-[#111827]",
  bm_lewis: "text-[#065f46]",
}
