"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { api } from "@/lib/api"
import { qk } from "@/lib/query-keys"
import type { Mindmap, MindmapData } from "@workspace/types"

export function useMindmaps(notebookId: string) {
  return useQuery({
    queryKey: qk.mindmaps(notebookId),
    queryFn: () => api.listMindmaps(notebookId),
    enabled: !!notebookId,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
  })
}

export function useAddMindmap(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { title?: string; data?: MindmapData }) =>
      api.addMindmap({ notebookId, ...input }),
    onSuccess: (row) => {
      qc.setQueryData<Mindmap[] | undefined>(
        qk.mindmaps(notebookId),
        (prev) => (prev ? [row, ...prev] : [row]),
      )
    },
  })
}

export function useUpdateMindmap(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; title?: string; data?: MindmapData }) =>
      api.updateMindmap(input.id, { title: input.title, data: input.data }),
    onSuccess: (row) => {
      if (!row) return
      qc.setQueryData<Mindmap[] | undefined>(
        qk.mindmaps(notebookId),
        (prev) => (prev ? prev.map((m) => (m.id === row.id ? row : m)) : prev),
      )
    },
  })
}

export function useDeleteMindmap(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteMindmap(id),
    onSuccess: (_, id) => {
      qc.setQueryData<Mindmap[] | undefined>(
        qk.mindmaps(notebookId),
        (prev) => prev?.filter((m) => m.id !== id),
      )
    },
  })
}
