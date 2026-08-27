"use client"

import Link from "next/link"

import { useRecentNotebooks } from "@/lib/hooks/use-workspace"
import { NotebookCard } from "@/components/notebook-card"

const HOME_RECENTS_LIMIT = 8

export function HomeRecents() {
  const recents = useRecentNotebooks(HOME_RECENTS_LIMIT)
  const items = recents.data ?? []

  if (items.length === 0) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">Recents</h2>
        <Link
          href="/library"
          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((nb) => (
          <NotebookCard key={nb.id} notebook={nb} />
        ))}
      </div>
    </section>
  )
}
