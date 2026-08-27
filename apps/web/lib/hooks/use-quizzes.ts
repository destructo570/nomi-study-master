"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { api } from "@/lib/api"
import { qk } from "@/lib/query-keys"

export function useQuizzes(notebookId: string) {
  return useQuery({
    queryKey: qk.quizzes(notebookId),
    queryFn: () => api.listQuizzes(notebookId),
    enabled: !!notebookId,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
  })
}

export function useAddQuiz(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      question: string
      options: string[]
      correctAnswer: string
      order?: number
    }) => api.addQuiz({ notebookId, ...input }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.quizzes(notebookId) }),
  })
}

export function useUpdateQuiz(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      id: string
      question?: string
      options?: string[]
      correctAnswer?: string
    }) =>
      api.updateQuiz(input.id, {
        question: input.question,
        options: input.options,
        correctAnswer: input.correctAnswer,
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.quizzes(notebookId) }),
  })
}

export function useDeleteQuiz(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteQuiz(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.quizzes(notebookId) }),
  })
}
