"use client"

import { useState } from "react"
import Link from "next/link"

import { contentApi, type ContentJobStatus } from "@/lib/api/admin-content"

type Row = { label: string; value: React.ReactNode }

const TYPES = [
  "feature", "blog", "alternative", "comparison", "tutorial",
  "faq", "landing", "doc", "usecase", "programmatic",
]

export default function GenerateContentPage() {
  const [type, setType] = useState("feature")
  const [topic, setTopic] = useState("")
  const [angle, setAngle] = useState("")
  const [tone, setTone] = useState("helpful, professional, friendly")
  const [words, setWords] = useState(900)
  const [instructions, setInstructions] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [job, setJob] = useState<ContentJobStatus | null>(null)
  const [result, setResult] = useState<{ json: Record<string, unknown>; markdown: string; score: Record<string, unknown> } | null>(null)

  async function submit() {
    if (!topic.trim()) { setError("Topic is required"); return }
    setBusy(true); setError(null); setJob(null); setResult(null)
    try {
      const res = await contentApi.generate({
        type, topic: topic.trim(), angle: angle.trim() || undefined,
        tone, targetWordCount: words, customInstructions: instructions.trim(),
      })
      setJob(res.job)
      setResult(res.result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "generation failed")
    } finally {
      setBusy(false)
    }
  }

  const stageRows: Row[] = job
    ? Object.entries(job.stages).map(([k, s]) => ({ label: k, value: <span className={statusColor(s.status)}>{s.status}</span> }))
    : []

  const scoreRows: Row[] = result ? scoreToRows(result.score) : []

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <Link href="/admin/content" className="hover:text-foreground">Content</Link>
          <span>/</span>
          <span className="text-foreground">Generate</span>
        </div>
        <h1 className="font-display text-[28px] font-light tracking-[-0.02em] md:text-[32px]">
          Generate content
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* form */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <Field label="Content type">
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px]">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Topic / primary keyword" required>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. AI Flashcard Generator" className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px]" />
          </Field>
          <Field label="Angle (optional)">
            <input value={angle} onChange={(e) => setAngle(e.target.value)} placeholder="e.g. college students, vs Anki" className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px]" />
          </Field>
          <Field label="Tone">
            <input value={tone} onChange={(e) => setTone(e.target.value)} className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px]" />
          </Field>
          <Field label={`Target word count: ${words}`}>
            <input type="range" min={300} max={2500} step={100} value={words} onChange={(e) => setWords(Number(e.target.value))} className="w-full" />
          </Field>
          <Field label="Custom instructions">
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} placeholder="e.g. mention spaced repetition prominently" className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px]" />
          </Field>
          {error && <p className="text-[12.5px] text-red-600 dark:text-red-400">{error}</p>}
          <button
            onClick={submit}
            disabled={busy}
            className="w-full rounded-md bg-foreground px-3 py-2 text-[13px] font-medium text-background transition-opacity disabled:opacity-50"
          >
            {busy ? "Generating…" : "Generate"}
          </button>
        </div>

        {/* result */}
        <div className="space-y-4">
          {job && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Pipeline</p>
                <span className={statusColor(job.status)}>{job.status} {job.score != null ? `· ${job.score}/100` : ""}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
                {stageRows.map((r) => (
                  <div key={r.label} className="flex items-center gap-1.5 text-[12.5px]">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result && (
            <>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Score breakdown</p>
                <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {scoreRows.map((r) => (
                    <div key={r.label} className="flex justify-between text-[12.5px]">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Generated MDX</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(result.markdown)}
                    className="text-[12px] text-muted-foreground underline hover:text-foreground"
                  >
                    copy
                  </button>
                </div>
                <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-[12px] leading-relaxed">
                  {result.markdown}
                </pre>
              </div>
            </>
          )}

          {!job && !busy && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-[13px] text-muted-foreground">
              Fill the form and click Generate. The pipeline runs research → outline →
              section-by-section writing → review → score → export.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] text-muted-foreground">{label}{required && " *"}</span>
      {children}
    </label>
  )
}

function statusColor(s: string): string {
  if (s === "done") return "text-foreground"
  if (s === "failed") return "text-red-600 dark:text-red-400"
  if (s === "running" || s === "queued") return "text-muted-foreground"
  return "text-muted-foreground/60"
}

function scoreToRows(score: Record<string, unknown>): Row[] {
  const keep = ["overall", "seo", "readability", "naturalness", "productAccuracy", "grammar", "ctaQuality", "eeat", "internalLinking"]
  const rows: Row[] = []
  for (const k of keep) {
    const v = score[k]
    if (typeof v === "number") rows.push({ label: k, value: v })
  }
  return rows
}