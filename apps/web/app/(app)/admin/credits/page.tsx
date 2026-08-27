"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

import { api, type AdminPromoSubmissionRow } from "@/lib/api"

const STATUS_FILTERS = ["pending", "approved", "rejected"] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

export default function AdminCreditsPage() {
  const [filter, setFilter] = useState<StatusFilter>("pending")

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-[32px] font-light tracking-[-0.02em] md:text-[36px]">
          Credit grants
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Review TikTok / Reels submissions and grant credits manually.
        </p>
      </header>

      <div className="flex items-center gap-1 rounded-full border border-border bg-card p-0.5 text-[12px]">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={
              filter === s
                ? "rounded-full bg-foreground px-3 py-1 font-medium text-background"
                : "rounded-full px-3 py-1 text-muted-foreground hover:text-foreground"
            }
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <SubmissionTable filter={filter} />

      <ManualGrantPanel />
    </div>
  )
}

function SubmissionTable({ filter }: { filter: StatusFilter }) {
  const queryClient = useQueryClient()
  const submissions = useQuery({
    queryKey: ["admin", "promo-submissions", filter],
    queryFn: () => api.adminListPromoSubmissions(filter),
    staleTime: 10_000,
  })

  const reviewMutation = useMutation({
    mutationFn: api.adminReviewPromoSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "promo-submissions"] })
      toast.success("Reviewed")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Review failed")
    },
  })

  if (submissions.isLoading) {
    return <p className="text-[13px] text-muted-foreground">Loading…</p>
  }

  const rows = submissions.data ?? []
  if (rows.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground">
        No {filter} submissions.
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <SubmissionItem
          key={row.submission.id}
          row={row}
          onReview={(input) => reviewMutation.mutate(input)}
          disabled={reviewMutation.isPending}
        />
      ))}
    </ul>
  )
}

function SubmissionItem({
  row,
  onReview,
  disabled,
}: {
  row: AdminPromoSubmissionRow
  onReview: (input: {
    id: string
    status: "approved" | "rejected"
    creditsAwarded?: number
    viewsAtApproval?: number
    notes?: string
  }) => void
  disabled: boolean
}) {
  const [credits, setCredits] = useState("100")
  const [views, setViews] = useState("")
  const [notes, setNotes] = useState("")
  const submission = row.submission
  const isPending = submission.status === "pending"

  return (
    <li className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <a
            href={submission.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-[13px] font-medium hover:underline"
          >
            {submission.postUrl}
          </a>
          <p className="text-[12px] text-muted-foreground">
            {row.userName ?? row.userEmail ?? submission.userId} ·{" "}
            {submission.platform} ·{" "}
            {new Date(submission.submittedAt).toLocaleString()}
          </p>
          {submission.notes && (
            <p className="text-[12px] text-muted-foreground">
              Notes: {submission.notes}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <span
            className={
              submission.status === "approved"
                ? "rounded-full bg-foreground px-2 py-0.5 text-[11px] font-medium text-background"
                : submission.status === "rejected"
                  ? "rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  : "rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-foreground"
            }
          >
            {submission.status}
          </span>
          {submission.status === "approved" && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              +{submission.creditsAwarded} credits
            </p>
          )}
        </div>
      </div>

      {isPending && (
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
          <div className="space-y-1">
            <Label className="text-[11px]">Views</Label>
            <Input
              type="number"
              min={0}
              value={views}
              onChange={(e) => setViews(e.target.value)}
              placeholder="e.g. 12500"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Credits</Label>
            <Input
              type="number"
              min={0}
              max={10000}
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="optional"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() =>
                onReview({
                  id: submission.id,
                  status: "rejected",
                  notes: notes || undefined,
                })
              }
            >
              Reject
            </Button>
            <Button
              size="sm"
              disabled={disabled}
              onClick={() =>
                onReview({
                  id: submission.id,
                  status: "approved",
                  creditsAwarded: Number(credits) || 0,
                  viewsAtApproval: views ? Number(views) : undefined,
                  notes: notes || undefined,
                })
              }
            >
              Approve
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}

function ManualGrantPanel() {
  const [userId, setUserId] = useState("")
  const [amount, setAmount] = useState("100")
  const [reason, setReason] = useState("manual_grant")

  const grant = useMutation({
    mutationFn: api.adminGrantCredits,
    onSuccess: (res) => {
      toast.success(
        `Granted - new balance ${res.credits.balance} (lifetime ${res.credits.lifetimeGranted})`,
      )
      setUserId("")
      setAmount("100")
      setReason("manual_grant")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Grant failed")
    },
  })

  function handleGrant(e: React.FormEvent) {
    e.preventDefault()
    if (!userId.trim()) return
    grant.mutate({
      userId: userId.trim(),
      amount: Number(amount) || 0,
      reason: reason.trim() || "manual_grant",
    })
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <header className="space-y-1">
        <h2 className="font-heading text-[16px] font-medium">
          Manual credit grant
        </h2>
        <p className="text-[12px] text-muted-foreground">
          Add credits to any user by ID. Useful for support or one-off promos.
        </p>
      </header>
      <form
        onSubmit={handleGrant}
        className="grid gap-2 sm:grid-cols-[2fr_1fr_2fr_auto] sm:items-end"
      >
        <div className="space-y-1">
          <Label className="text-[11px]">User ID</Label>
          <Input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="usr_…"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">Amount</Label>
          <Input
            type="number"
            min={1}
            max={10000}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">Reason</Label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={grant.isPending || !userId.trim()}>
          {grant.isPending ? "Granting…" : "Grant"}
        </Button>
      </form>
    </section>
  )
}
