"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { qk } from "@/lib/query-keys"
import type { FlashcardCount, QuizCount } from "@workspace/types/plan"
import type {
  Flashcard,
  Mindmap,
  MindmapDepth,
  Quiz,
  Summary,
  SummaryDepth,
} from "@workspace/types"

export function useGenerateSummary(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { depth: SummaryDepth; prompt?: string; language?: string }) =>
      api.generateSummary(notebookId, input),
    onSuccess: (row) => {
      qc.setQueryData<Summary | null>(qk.summary(notebookId), row)
      qc.setQueryData<Summary[] | undefined>(
        qk.summaryHistory(notebookId),
        (prev) => (prev ? [row, ...prev] : [row]),
      )
      qc.invalidateQueries({ queryKey: qk.usage() })
      qc.invalidateQueries({ queryKey: qk.recents() })
    },
  })
}

export function useGenerateFlashcards(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { count: FlashcardCount; prompt?: string; language?: string }) =>
      api.generateFlashcards(notebookId, input),
    onSuccess: (rows) => {
      qc.setQueryData<Flashcard[] | undefined>(
        qk.flashcards(notebookId),
        (prev) => (prev ? [...prev, ...rows] : rows),
      )
      qc.invalidateQueries({ queryKey: qk.usage() })
      qc.invalidateQueries({ queryKey: qk.recents() })
    },
  })
}

export function useGenerateQuizzes(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { count: QuizCount; prompt?: string; language?: string }) =>
      api.generateQuizzes(notebookId, input),
    onSuccess: (rows) => {
      qc.setQueryData<Quiz[] | undefined>(
        qk.quizzes(notebookId),
        (prev) => (prev ? [...prev, ...rows] : rows),
      )
      qc.invalidateQueries({ queryKey: qk.usage() })
      qc.invalidateQueries({ queryKey: qk.recents() })
    },
  })
}

export function useGenerateMindmap(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      title?: string
      prompt?: string
      depth?: MindmapDepth
      language?: string
    }) => api.generateMindmap(notebookId, input),
    onSuccess: (row) => {
      qc.setQueryData<Mindmap[] | undefined>(
        qk.mindmaps(notebookId),
        (prev) => (prev ? [row, ...prev] : [row]),
      )
      qc.invalidateQueries({ queryKey: qk.usage() })
      qc.invalidateQueries({ queryKey: qk.recents() })
    },
  })
}

/* ------------------------------------------------------------------ */
/* Translate hooks                                                      */
/* ------------------------------------------------------------------ */

export function useTranslateSummary(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { targetLanguage: string }) =>
      api.translateSummary(notebookId, input),
    onSuccess: (row) => {
      qc.setQueryData<Summary | null>(qk.summary(notebookId), row)
      qc.setQueryData<Summary[] | undefined>(
        qk.summaryHistory(notebookId),
        (prev) => (prev ? [row, ...prev.filter((s) => s.id !== row.id)] : [row]),
      )
      qc.invalidateQueries({ queryKey: qk.usage() })
      qc.invalidateQueries({ queryKey: qk.recents() })
    },
  })
}

export function useTranslateFlashcards(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { targetLanguage: string }) =>
      api.translateFlashcards(notebookId, input),
    onSuccess: (rows) => {
      qc.setQueryData<Flashcard[] | undefined>(
        qk.flashcards(notebookId),
        (prev) => (prev ? [...prev, ...rows] : rows),
      )
      qc.invalidateQueries({ queryKey: qk.usage() })
      qc.invalidateQueries({ queryKey: qk.recents() })
    },
  })
}

export function useTranslateQuizzes(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { targetLanguage: string }) =>
      api.translateQuizzes(notebookId, input),
    onSuccess: (rows) => {
      qc.setQueryData<Quiz[] | undefined>(
        qk.quizzes(notebookId),
        (prev) => (prev ? [...prev, ...rows] : rows),
      )
      qc.invalidateQueries({ queryKey: qk.usage() })
      qc.invalidateQueries({ queryKey: qk.recents() })
    },
  })
}

export function useTranslateMindmap(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { targetLanguage: string }) =>
      api.translateMindmap(notebookId, input),
    onSuccess: (row) => {
      qc.setQueryData<Mindmap[] | undefined>(
        qk.mindmaps(notebookId),
        (prev) => (prev ? [row, ...prev.filter((m) => m.id !== row.id)] : [row]),
      )
      qc.invalidateQueries({ queryKey: qk.usage() })
      qc.invalidateQueries({ queryKey: qk.recents() })
    },
  })
}
