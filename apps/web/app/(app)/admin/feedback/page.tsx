"use client"

import { useQuery } from "@tanstack/react-query"

import { api, type AdminFeedbackRow } from "@/lib/api"

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export default function AdminFeedbackPage() {
  const query = useQuery<AdminFeedbackRow[]>({
    queryKey: ["admin", "feedback"],
    queryFn: () => api.adminListFeedback(),
  })

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-[32px] font-light tracking-[-0.02em] md:text-[36px]">
          Feedback
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Latest submissions from the sidebar Feedback dialog.
        </p>
      </header>

      {query.isLoading && (
        <p className="text-[13px] text-muted-foreground">Loading…</p>
      )}
      {query.isError && (
        <p className="text-[13px] text-destructive">
          Could not load feedback.
        </p>
      )}
      {query.data && query.data.length === 0 && (
        <p className="text-[13px] text-muted-foreground">
          No feedback yet.
        </p>
      )}

      <div className="space-y-3">
        {query.data?.map((row) => (
          <article
            key={row.feedback.id}
            className="rounded-2xl border border-border bg-card p-4 md:p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <div className="min-w-0">
                <p className="text-[13px] font-medium">
                  {row.userName || row.userEmail || "Unknown user"}
                </p>
                {row.userName && row.userEmail && (
                  <p className="truncate text-[12px] text-muted-foreground">
                    {row.userEmail}
                  </p>
                )}
              </div>
              <time className="text-[11.5px] text-muted-foreground">
                {formatDate(row.feedback.createdAt)}
              </time>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-[13.5px] leading-relaxed">
              {row.feedback.message}
            </p>
            {row.feedback.userAgent && (
              <p className="mt-3 truncate text-[11px] text-muted-foreground">
                {row.feedback.userAgent}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
