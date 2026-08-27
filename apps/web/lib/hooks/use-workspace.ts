"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { api } from "@/lib/api"
import { qk } from "@/lib/query-keys"
import type { Notebook, TutorPreset } from "@workspace/types"

export function useShelves() {
  return useQuery({ queryKey: qk.shelves(), queryFn: () => api.listShelves() })
}

export function useShelf(id: string) {
  return useQuery({
    queryKey: qk.shelf(id),
    queryFn: () => api.getShelf(id),
    enabled: !!id,
  })
}

export function useNotebooksByShelf(shelfId: string) {
  return useQuery({
    queryKey: qk.notebooksByShelf(shelfId),
    queryFn: () => api.listNotebooks(shelfId),
    enabled: !!shelfId,
  })
}

export function useRecentNotebooks(limit = 5) {
  return useQuery({
    queryKey: qk.recents(),
    queryFn: () => api.listRecentNotebooks(limit),
  })
}

export function useNotebook(id: string) {
  return useQuery({
    queryKey: qk.notebook(id),
    queryFn: () => api.getNotebook(id),
    enabled: !!id,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
  })
}

export function useCreateShelf() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => api.createShelf(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.shelves() }),
  })
}

export function useRenameShelf() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.renameShelf(id, name),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: qk.shelves() })
      qc.invalidateQueries({ queryKey: qk.shelf(v.id) })
    },
  })
}

export function useDeleteShelf() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteShelf(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.shelves() })
      qc.invalidateQueries({ queryKey: qk.recents() })
    },
  })
}

export function useCreateNotebook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      shelfId,
      title,
      cover,
      language,
    }: {
      shelfId: string
      title: string
      cover?: string
      language?: string
    }) => api.createNotebook(shelfId, title, cover, language),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: qk.notebooksByShelf(v.shelfId) })
      qc.invalidateQueries({ queryKey: qk.shelves() })
      qc.invalidateQueries({ queryKey: qk.recents() })
    },
  })
}

export function useUpdateNotebookCover() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, cover }: { id: string; cover: string }) =>
      api.updateNotebookCover(id, cover),
    onSuccess: (nb) => {
      if (!nb) return
      qc.invalidateQueries({ queryKey: qk.notebooksByShelf(nb.shelfId) })
      qc.invalidateQueries({ queryKey: qk.notebook(nb.id) })
      qc.invalidateQueries({ queryKey: qk.recents() })
    },
  })
}

export function useRenameNotebook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      api.renameNotebook(id, title),
    onSuccess: (nb) => {
      if (!nb) return
      qc.invalidateQueries({ queryKey: qk.notebooksByShelf(nb.shelfId) })
      qc.invalidateQueries({ queryKey: qk.notebook(nb.id) })
      qc.invalidateQueries({ queryKey: qk.recents() })
    },
  })
}

export function useUpdateNotebookTutorPreset(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tutorPreset: TutorPreset | null) =>
      api.updateNotebookTutorPreset(notebookId, tutorPreset),
    onMutate: async (tutorPreset) => {
      await qc.cancelQueries({ queryKey: qk.notebook(notebookId) })
      const prev = qc.getQueryData<Notebook | null>(qk.notebook(notebookId))
      if (prev) {
        qc.setQueryData<Notebook | null>(qk.notebook(notebookId), {
          ...prev,
          tutorPreset: tutorPreset ?? undefined,
        })
      }
      return { prev }
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev !== undefined) {
        qc.setQueryData(qk.notebook(notebookId), ctx.prev)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.notebook(notebookId) })
    },
  })
}

export function useUpdateNotebookLanguage(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (language: string | null) =>
      api.updateNotebookLanguage(notebookId, language),
    onMutate: async (language) => {
      await qc.cancelQueries({ queryKey: qk.notebook(notebookId) })
      const prev = qc.getQueryData<Notebook | null>(qk.notebook(notebookId))
      if (prev) {
        qc.setQueryData<Notebook | null>(qk.notebook(notebookId), {
          ...prev,
          language: language ?? null,
        })
      }
      return { prev }
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev !== undefined) {
        qc.setQueryData(qk.notebook(notebookId), ctx.prev)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.notebook(notebookId) })
    },
  })
}

export function useDeleteNotebook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; shelfId: string }) =>
      api.deleteNotebook(id),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: qk.notebooksByShelf(v.shelfId) })
      qc.invalidateQueries({ queryKey: qk.recents() })
    },
  })
}
