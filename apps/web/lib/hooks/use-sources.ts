"use client"

import { useEffect, useRef } from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { api } from "@/lib/api"
import { qk } from "@/lib/query-keys"
import type { Source } from "@workspace/types"

export function useSources(notebookId: string) {
  const qc = useQueryClient()
  const previousStatuses = useRef<Map<string, string>>(new Map())

  const query = useQuery({
    queryKey: qk.sources(notebookId),
    queryFn: () => api.listSources(notebookId),
    enabled: !!notebookId,
    staleTime: Infinity,
    refetchInterval: (q) => {
      const rows = q.state.data
      if (!rows) return false
      return rows.some(
        (s) => s.status === "processing" || s.status === "pending_upload",
      )
        ? 4000
        : false
    },
  })

  // When a URL source finishes processing the worker may have renamed
  // the parent notebook (auto-titled from the resolved metadata). Refresh
  // the notebook detail + sidebar lists so the breadcrumb and sidebar
  // pick up the new name without a full reload.
  useEffect(() => {
    const rows = query.data
    if (!rows) return
    const prev = previousStatuses.current
    let transitioned = false
    for (const s of rows) {
      const old = prev.get(s.id)
      if (
        old &&
        old !== "ready" &&
        s.status === "ready" &&
        (s.type === "youtube" || s.type === "article")
      ) {
        transitioned = true
      }
      prev.set(s.id, s.status)
    }
    if (transitioned) {
      qc.invalidateQueries({ queryKey: qk.notebook(notebookId) })
      // Matches both notebooksByShelf(*) and recents().
      qc.invalidateQueries({ queryKey: ["notebooks"] })
      qc.invalidateQueries({ queryKey: qk.shelves() })
    }
  }, [query.data, qc, notebookId])

  return query
}

type AddSourceInput =
  | { type: "text"; title: string; content: string }
  | { type: "url"; url: string; title?: string }

export function useAddSource(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AddSourceInput) =>
      input.type === "text"
        ? api.addSource({ notebookId, ...input })
        : api.addSource({ notebookId, ...input }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.sources(notebookId) }),
  })
}

export async function uploadFileToNotebookSource(input: {
  notebookId: string
  file: File
  title?: string
}): Promise<Source> {
  const { notebookId, file, title } = input
  const mime = file.type || "application/octet-stream"
  const { source, uploadUrl } = await api.createSourceUploadUrl({
    notebookId,
    fileName: file.name,
    mimeType: mime,
    sizeBytes: file.size,
  })

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mime },
    body: file,
  })
  if (!putRes.ok) {
    throw new Error(
      `Upload failed (${putRes.status}): ${await putRes.text().catch(() => "")}`,
    )
  }

  return api.completeSourceUpload({
    notebookId,
    sourceId: source.id,
    title: title?.trim() || undefined,
  })
}

export function useUploadSourceFile(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { file: File; title?: string }) =>
      uploadFileToNotebookSource({ notebookId, ...input }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.sources(notebookId) }),
  })
}

export function useDeleteSource(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteSource(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: qk.sources(notebookId) }),
  })
}

export function useSourceFileUrl(sourceId: string | null | undefined) {
  return useQuery({
    queryKey: qk.sourceFileUrl(sourceId ?? ""),
    queryFn: () => api.getSourceFileUrl(sourceId!),
    enabled: !!sourceId,
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function useRetrySource(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sourceId: string) =>
      api.retrySourceUpload({ notebookId, sourceId }),
    onSuccess: (updated) => {
      qc.setQueryData<Source[] | undefined>(qk.sources(notebookId), (prev) =>
        prev ? prev.map((s) => (s.id === updated.id ? updated : s)) : prev,
      )
      qc.invalidateQueries({ queryKey: qk.sources(notebookId) })
    },
  })
}

export function useUpdateSource(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; title?: string; content?: string }) =>
      api.updateSource(id, input),
    onSuccess: (updated) => {
      qc.setQueryData<Source[] | undefined>(qk.sources(notebookId), (prev) =>
        prev ? prev.map((s) => (s.id === updated.id ? updated : s)) : prev,
      )
    },
  })
}

export function useTranslateSource(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      targetLanguage,
    }: {
      id: string
      targetLanguage: string
    }) => api.translateSource(id, { targetLanguage }),
    onSuccess: (updated) => {
      qc.setQueryData<Source[] | undefined>(qk.sources(notebookId), (prev) =>
        prev ? prev.map((s) => (s.id === updated.id ? updated : s)) : prev,
      )
      qc.invalidateQueries({ queryKey: qk.usage() })
    },
  })
}

type SourceUpdate = { title?: string; content?: string }

export function useDebouncedUpdateSource(
  notebookId: string,
  delay = 600,
): (id: string, input: SourceUpdate) => void {
  const update = useUpdateSource(notebookId)
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const latest = useRef<Map<string, SourceUpdate>>(new Map())

  useEffect(() => {
    const map = timers.current
    return () => {
      for (const t of map.values()) clearTimeout(t)
      map.clear()
    }
  }, [])

  return (id, input) => {
    const merged = { ...(latest.current.get(id) ?? {}), ...input }
    latest.current.set(id, merged)
    const existing = timers.current.get(id)
    if (existing) clearTimeout(existing)
    const t = setTimeout(() => {
      const payload = latest.current.get(id)
      latest.current.delete(id)
      timers.current.delete(id)
      if (payload) update.mutate({ id, ...payload })
    }, delay)
    timers.current.set(id, t)
  }
}
