"use client"

import { request } from "@/lib/api"

/* ----------------------------------------------------------------------------
 * Admin content engine client. Mirrors the backend route in
 * apps/backend/src/routes/content.ts. Types kept loose (Record/unknown) — the
 * backend Zod schemas are the source of truth; the UI is read-mostly + runs.
 * -------------------------------------------------------------------------- */

export type ContentJobStatus = {
  id: string
  type: string
  topic: string
  status: "queued" | "running" | "done" | "failed"
  score: number | null
  progress: number
  createdAt: string
  updatedAt: string
  resultId: string | null
  stages: Record<string, { status: string; startedAt: string | null; finishedAt: string | null; logs: string[]; error: string | null }>
}

export type ContentTemplate = {
  type: string
  label: string
  intent: string
  schemaType: string
  recommendedWordCount: number
  minFaqs: number
  sections: { id: string; heading: string; brief: string; words: number; required: boolean }[]
}

export type GenerateBody = {
  type: string
  topic: string
  angle?: string
  tone?: string
  readingLevel?: string
  targetWordCount?: number
  customInstructions?: string
  competitorId?: string
}

export const contentApi = {
  health: () => request<{ ok: boolean; model: string; apiKey: boolean }>("/api/admin/content/health"),
  templates: () => request<ContentTemplate[]>("/api/admin/content/templates"),
  knowledge: () => request<Record<string, unknown>>("/api/admin/content/knowledge"),
  competitors: () => request<Record<string, unknown>[]>("/api/admin/content/competitors"),
  jobs: () => request<ContentJobStatus[]>("/api/admin/content/jobs"),
  job: (id: string) => request<ContentJobStatus>(`/api/admin/content/jobs/${id}`),
  library: () => request<{ posts: unknown[]; seoPages: unknown[]; jobs: unknown[] }>("/api/admin/content/library"),
  generate: (body: GenerateBody) =>
    request<{ job: ContentJobStatus; result: { json: Record<string, unknown>; markdown: string; score: Record<string, unknown> } }>(
      "/api/admin/content/generate", { method: "POST", json: body },
    ),
}