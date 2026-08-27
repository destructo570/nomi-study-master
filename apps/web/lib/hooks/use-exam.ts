"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { api } from "@/lib/api"
import { qk } from "@/lib/query-keys"

export function useExam(notebookId: string) {
  return useQuery({
    queryKey: qk.exam(notebookId),
    queryFn: () => api.listExam(notebookId),
    enabled: !!notebookId,
  })
}

export function useAddExam(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      question: string
      answer: string
      explanation?: string
      order?: number
    }) => api.addExam({ notebookId, ...input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.exam(notebookId) }),
  })
}

export function useDeleteExam(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteExam(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.exam(notebookId) }),
  })
}
