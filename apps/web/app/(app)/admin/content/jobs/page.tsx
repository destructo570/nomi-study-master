import Link from "next/link"

import { contentApi, type ContentJobStatus } from "@/lib/api/admin-content"

export const dynamic = "force-dynamic"
export const metadata = { title: "Content Jobs" }

export default async function ContentJobsPage() {
  let jobs: ContentJobStatus[] = []
  try {
    jobs = await contentApi.jobs()
  } catch {
    // backend unreachable
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <Link href="/admin/content" className="hover:text-foreground">Content</Link>
          <span>/</span>
          <span className="text-foreground">Jobs</span>
        </div>
        <h1 className="font-display text-[28px] font-light tracking-[-0.02em] md:text-[32px]">
          Generation jobs
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Most recent generations, with per-stage status and logs.
        </p>
      </header>

      {jobs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-[13px] text-muted-foreground">
          No jobs yet.{" "}
          <Link href="/admin/content/generate" className="underline hover:text-foreground">Generate content</Link>.
        </p>
      ) : (
        <div className="space-y-4">
          {jobs.map((j) => (
            <div key={j.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[13.5px] font-medium">{j.topic}</p>
                  <p className="text-[12px] text-muted-foreground">{j.type} · {new Date(j.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3 text-[12.5px]">
                  <span className={statusColor(j.status)}>{j.status}</span>
                  {j.score != null && <span>{j.score}/100</span>}
                  <span className="text-muted-foreground">{j.progress}%</span>
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(j.stages).map(([k, s]) => (
                  <div key={k} className="rounded-md border border-border p-2.5">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-muted-foreground">{k}</span>
                      <span className={statusColor(s.status)}>{s.status}</span>
                    </div>
                    {s.error && <p className="mt-1 text-[11.5px] text-red-600 dark:text-red-400">{s.error}</p>}
                    {s.logs.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5 text-[11px] text-muted-foreground">
                        {s.logs.slice(-3).map((l, i) => <li key={i} className="truncate">{l}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function statusColor(s: string): string {
  if (s === "done") return "text-foreground"
  if (s === "failed") return "text-red-600 dark:text-red-400"
  if (s === "running" || s === "queued") return "text-muted-foreground"
  return "text-muted-foreground/60"
}