"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { api, type ArchiveItemType } from "@/lib/api"
import { qk } from "@/lib/query-keys"

export function useArchive() {
  return useQuery({ queryKey: qk.archive(), queryFn: () => api.getArchive() })
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: qk.archive() })
  qc.invalidateQueries({ queryKey: qk.shelves() })
  qc.invalidateQueries({ queryKey: qk.recents() })
  qc.invalidateQueries({ queryKey: ["notebooks"] })
}

export function useRestoreArchived() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { type: ArchiveItemType; id: string }) =>
      api.restoreArchived(input),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useDeleteArchived() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { type: ArchiveItemType; id: string }) =>
      api.deleteArchived(input),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useEmptyArchive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.emptyArchive(),
    onSuccess: () => invalidateAll(qc),
  })
}
