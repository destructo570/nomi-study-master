"use client"

import { useEffect, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { qk } from "@/lib/query-keys"
import type { Notebook, NotebookDoc } from "@workspace/types"

export function useSaveNotebookNotes(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (notes: NotebookDoc | null) =>
      api.saveNotebookNotes(notebookId, notes),
    onSuccess: (nb) => {
      if (!nb) return
      qc.setQueryData<Notebook | null | undefined>(
        qk.notebook(nb.id),
        () => nb,
      )
      qc.invalidateQueries({ queryKey: qk.recents() })
    },
  })
}

export function useDebouncedSaveNotebookNotes(
  notebookId: string,
  delay = 600,
): (notes: NotebookDoc | null) => void {
  const save = useSaveNotebookNotes(notebookId)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef<NotebookDoc | null | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return (notes) => {
    latest.current = notes
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (latest.current !== undefined) save.mutate(latest.current)
      latest.current = undefined
    }, delay)
  }
}
