import Link from "next/link"

import { contentApi } from "@/lib/api/admin-content"

export const dynamic = "force-dynamic"

export const metadata = { title: "Content Engine" }

async function getTemplates() {
  try {
    const [templates, health, jobs, library] = await Promise.all([
      contentApi.templates(),
      contentApi.health(),
      contentApi.jobs(),
      contentApi.library(),
    ])
    return { templates, health, jobs: jobs.slice(0, 5), library }
  } catch {
    return { templates: [], health: null, jobs: [], library: null }
  }
}

export default async function AdminContentPage() {
  const { templates, health, jobs, library } = await getTemplates()

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-[32px] font-light tracking-[-0.02em] md:text-[36px]">
          Content Engine
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Generate and manage SEO pages for nomi.com. Research → Brief → Outline → Write →
          Review → Score → Export.
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Engine</p>
            <p className="text-[14px]">
              status:{" "}
              <span className={health?.apiKey ? "text-foreground" : "text-muted-foreground"}>
                {health?.apiKey ? "ready" : "API key missing"}
              </span>{" "}
              · model {health?.model ?? "—"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/content/generate"
              className="rounded-md border border-border px-3 py-1.5 text-[13px] transition-colors hover:border-foreground/40"
            >
              Generate
            </Link>
            <Link
              href="/admin/content/library"
              className="rounded-md border border-border px-3 py-1.5 text-[13px] transition-colors hover:border-foreground/40"
            >
              Library {library ? `(${(library.posts.length + library.seoPages.length)})` : ""}
            </Link>
            <Link
              href="/admin/content/jobs"
              className="rounded-md border border-border px-3 py-1.5 text-[13px] transition-colors hover:border-foreground/40"
            >
              Jobs
            </Link>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-[15px] font-medium">Recent jobs</h2>
        {jobs.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No generations yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Topic</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Score</th>
                  <th className="px-3 py-2 font-medium">Created</th>
                  <th className="px-3 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} className="border-t border-border">
                    <td className="px-3 py-2">{j.type}</td>
                    <td className="px-3 py-2">{j.topic}</td>
                    <td className="px-3 py-2">{j.status}</td>
                    <td className="px-3 py-2">{j.score ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(j.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <Link href="/admin/content/jobs" className="text-muted-foreground underline">
                        details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-medium">Templates ({templates.length})</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.type} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-[13.5px] font-medium">{t.label}</p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">{t.intent}</p>
              <p className="mt-2 text-[11.5px] text-muted-foreground">
                {t.sections.length} sections · ~{t.recommendedWordCount}w · {t.schemaType}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}