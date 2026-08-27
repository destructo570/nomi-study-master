"use client"

import { useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { qk } from "@/lib/query-keys"
import type { Shelf } from "@workspace/types"

const DEFAULT_SHELF_NAME = "Inbox"

export function useEnsureDefaultShelf() {
  const qc = useQueryClient()

  return async function ensureDefaultShelf(): Promise<Shelf> {
    const cached = qc.getQueryData<Shelf[]>(qk.shelves())
    const shelves: Shelf[] =
      cached ??
      (await qc.fetchQuery({
        queryKey: qk.shelves(),
        queryFn: () => api.listShelves(),
      }))
    const live = shelves.filter((s) => !s.archivedAt)
    if (live.length > 0) return live[0]!

    const created = await api.createShelf(DEFAULT_SHELF_NAME)
    qc.invalidateQueries({ queryKey: qk.shelves() })
    return created
  }
}
