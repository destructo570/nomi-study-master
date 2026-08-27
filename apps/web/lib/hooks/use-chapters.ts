"use client"

import { useEffect, useRef } from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { api } from "@/lib/api"
import { qk } from "@/lib/query-keys"
import type { GenerateOptions, SourceType, TutorPreset } from "@workspace/types"

export function useChapters(notebookId: string) {
  return useQuery({
    queryKey: qk.chapters(notebookId),
    queryFn: () => api.listChapters(notebookId),
    enabled: !!notebookId,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
  })
}

export function useChapter(id: string) {
  return useQuery({
    queryKey: qk.chapter(id),
    queryFn: () => api.getChapter(id),
    enabled: !!id,
  })
}

export function useSaveChapter(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string
      patch: { title?: string; markdown?: string }
    }) => api.saveChapter(id, patch),
    onSuccess: (ch) => {
      if (!ch) return
      qc.invalidateQueries({ queryKey: qk.chapters(notebookId) })
      qc.invalidateQueries({ queryKey: qk.chapter(ch.id) })
      qc.invalidateQueries({ queryKey: qk.recents() })
    },
  })
}

export function useDebouncedSaveChapter(
  notebookId: string,
  id: string,
  delay = 600,
): (patch: { title?: string; markdown?: string }) => void {
  const save = useSaveChapter(notebookId)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef<{ title?: string; markdown?: string } | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return (patch) => {
    latest.current = { ...latest.current, ...patch }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (latest.current) save.mutate({ id, patch: latest.current })
      latest.current = null
    }, delay)
  }
}

export function useCreateNotebookFromCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      shelfId: string
      title: string
      cover?: string
      tutorPreset?: TutorPreset
      customPrompt?: string
      language?: string
      source: {
        type: Extract<SourceType, "text" | "youtube">
        title: string
        content: string
        sizeBytes?: number
      }
      generateOptions?: GenerateOptions
    }) => api.createNotebookFromCourse(input),
    onSuccess: (nb) => {
      qc.invalidateQueries({ queryKey: qk.notebooksByShelf(nb.shelfId) })
      qc.invalidateQueries({ queryKey: qk.shelves() })
      qc.invalidateQueries({ queryKey: qk.recents() })
      void qc.refetchQueries({ queryKey: qk.me() })
    },
  })
}
