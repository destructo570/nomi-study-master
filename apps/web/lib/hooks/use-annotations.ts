"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { qk } from "@/lib/query-keys"
import type {
  Annotation,
  AnnotationColor,
  AnnotationRect,
} from "@workspace/types"

export function useAnnotations(sourceId: string | null | undefined) {
  return useQuery({
    queryKey: qk.annotations(sourceId ?? ""),
    queryFn: () => api.listAnnotations(sourceId!),
    enabled: !!sourceId,
    staleTime: 30 * 1000,
  })
}

export function useCreateAnnotation(sourceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      page: number
      color: AnnotationColor
      quotedText: string
      comment?: string | null
      rects: AnnotationRect[]
    }) => api.createAnnotation({ sourceId, ...input }),
    onSuccess: (created) => {
      qc.setQueryData<Annotation[] | undefined>(
        qk.annotations(sourceId),
        (prev) => (prev ? [...prev, created] : [created]),
      )
    },
  })
}

export function useUpdateAnnotation(sourceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...patch
    }: {
      id: string
      color?: AnnotationColor
      comment?: string | null
    }) => api.updateAnnotation(id, patch),
    onMutate: async ({ id, color, comment }) => {
      await qc.cancelQueries({ queryKey: qk.annotations(sourceId) })
      const prev = qc.getQueryData<Annotation[]>(qk.annotations(sourceId))
      if (prev) {
        qc.setQueryData<Annotation[]>(
          qk.annotations(sourceId),
          prev.map((a) =>
            a.id === id
              ? {
                  ...a,
                  color: color ?? a.color,
                  comment: comment === undefined ? a.comment : comment,
                }
              : a,
          ),
        )
      }
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.annotations(sourceId), ctx.prev)
    },
    onSuccess: (updated) => {
      qc.setQueryData<Annotation[] | undefined>(
        qk.annotations(sourceId),
        (prev) =>
          prev ? prev.map((a) => (a.id === updated.id ? updated : a)) : prev,
      )
    },
  })
}

export function useDeleteAnnotation(sourceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteAnnotation(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: qk.annotations(sourceId) })
      const prev = qc.getQueryData<Annotation[]>(qk.annotations(sourceId))
      if (prev) {
        qc.setQueryData<Annotation[]>(
          qk.annotations(sourceId),
          prev.filter((a) => a.id !== id),
        )
      }
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.annotations(sourceId), ctx.prev)
    },
  })
}
