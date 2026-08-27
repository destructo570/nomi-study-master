"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { api } from "@/lib/api"
import { qk } from "@/lib/query-keys"

export function useFlashcards(notebookId: string) {
  return useQuery({
    queryKey: qk.flashcards(notebookId),
    queryFn: () => api.listFlashcards(notebookId),
    enabled: !!notebookId,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
  })
}

export function useAddFlashcard(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      question: string
      answer: string
      hint?: string | null
      order?: number
    }) => api.addFlashcard({ notebookId, ...input }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.flashcards(notebookId) }),
  })
}

export function useUpdateFlashcard(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      id: string
      question?: string
      answer?: string
      hint?: string | null
    }) =>
      api.updateFlashcard(input.id, {
        question: input.question,
        answer: input.answer,
        hint: input.hint,
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.flashcards(notebookId) }),
  })
}

export function useDeleteFlashcard(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteFlashcard(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.flashcards(notebookId) }),
  })
}
