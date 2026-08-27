"use client"

import { useEffect, useRef } from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { api } from "@/lib/api"
import { qk } from "@/lib/query-keys"
import type { NotebookDoc } from "@workspace/types"

export function useNotebookDoc(id: string) {
  return useQuery({
    queryKey: qk.notebookDoc(id),
    queryFn: () => api.getNotebookDoc(id),
    enabled: !!id,
  })
}

export function useSaveNotebookDoc(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (doc: NotebookDoc) => api.saveNotebookDoc(id, doc),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.recents() })
    },
  })
}

export function useDebouncedSave(
  id: string,
  delay = 600,
): (doc: NotebookDoc) => void {
  const save = useSaveNotebookDoc(id)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef<NotebookDoc | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return (doc: NotebookDoc) => {
    latest.current = doc
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (latest.current) save.mutate(latest.current)
    }, delay)
  }
}
