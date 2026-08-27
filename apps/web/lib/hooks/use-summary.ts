"use client"

import { useEffect, useRef } from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { api } from "@/lib/api"
import { qk } from "@/lib/query-keys"
import type { Summary } from "@workspace/types"

export function useSummary(notebookId: string) {
  return useQuery({
    queryKey: qk.summary(notebookId),
    queryFn: () => api.getSummary(notebookId),
    enabled: !!notebookId,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
  })
}

export function useSummaryHistory(notebookId: string) {
  return useQuery({
    queryKey: qk.summaryHistory(notebookId),
    queryFn: () => api.listSummaries(notebookId),
    enabled: !!notebookId,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
  })
}

export function useSaveSummary(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; markdown: string }) =>
      api.saveSummary(notebookId, input),
    onSuccess: (row) => {
      qc.setQueryData<Summary[] | undefined>(
        qk.summaryHistory(notebookId),
        (prev) => prev?.map((s) => (s.id === row.id ? row : s)) ?? prev,
      )
      qc.setQueryData<Summary | null | undefined>(
        qk.summary(notebookId),
        (prev) => (prev && prev.id === row.id ? row : prev),
      )
      qc.invalidateQueries({ queryKey: qk.recents() })
    },
  })
}

export function useDebouncedSaveSummary(
  notebookId: string,
  delay = 600,
): (input: { id: string; markdown: string }) => void {
  const save = useSaveSummary(notebookId)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef<{ id: string; markdown: string } | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return (input) => {
    latest.current = input
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (latest.current) save.mutate(latest.current)
      latest.current = null
    }, delay)
  }
}
