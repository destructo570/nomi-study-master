import type { TutorPreset } from "@workspace/types"

import { loadPrompt } from "./prompts"

export type TutorPresetMeta = {
  id: TutorPreset
  label: string
  tagline: string
  description: string
  systemPrompt: string
  chatSystemPrompt: string
}

export const TUTOR_PRESETS: Record<TutorPreset, TutorPresetMeta> = {
  default: {
    id: "default",
    label: "Default tutor",
    tagline: "Clear, direct, balanced answers.",
    description:
      "Practical, balanced tutor — direct answer first, brief explanation, optional follow-up.",
    systemPrompt: "",
    chatSystemPrompt: loadPrompt("tutor-chat-default"),
  },
  eli5: {
    id: "eli5",
    label: "Explain Like I'm 5",
    tagline: "Friendly, plain-language, analogies first.",
    description:
      "Break ideas down with everyday analogies, simple sentences, and warm encouragement.",
    systemPrompt: loadPrompt("tutor-preset-eli5"),
    chatSystemPrompt: loadPrompt("tutor-chat-eli5"),
  },
  academic: {
    id: "academic",
    label: "Academic Scholar",
    tagline: "Rigorous, structured, citation-aware.",
    description:
      "Treat the reader as a graduate student. Define terms precisely, state assumptions, surface caveats.",
    systemPrompt: loadPrompt("tutor-preset-academic"),
    chatSystemPrompt: loadPrompt("tutor-chat-academic"),
  },
  socratic: {
    id: "socratic",
    label: "Socratic Tutor",
    tagline: "Question-driven, draws the answer out of you.",
    description:
      "Leads with probing questions, encourages reflection, then reveals the answer.",
    systemPrompt: loadPrompt("tutor-preset-socratic"),
    chatSystemPrompt: loadPrompt("tutor-chat-socratic"),
  },
}

export function buildSystemPrompt(
  preset: TutorPreset,
  customPrompt?: string,
  language?: string,
): string {
  const base = TUTOR_PRESETS[preset].systemPrompt
  const extra = customPrompt?.trim()
  const tail = loadPrompt("course-tail", language ? { language } : {})
  return extra
    ? `${base}\n\nAdditional tone from the user: ${extra}\n\n${tail}`
    : `${base}\n\n${tail}`
}
