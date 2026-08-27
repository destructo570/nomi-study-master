"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  EyeIcon,
  GiftIcon,
  InstagramIcon,
  Link02Icon,
  PlayCircleIcon,
  SparklesIcon,
  TiktokIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { cn } from "@workspace/ui/lib/utils"

import { api, type CreditPromoSubmission } from "@/lib/api"
import { qk } from "@/lib/query-keys"

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "How does the credit math work?",
    a: "Every 10,000 verified views earns you 100 credits. 50,000 views? 500 credits. Views are pulled directly from TikTok and Instagram once you submit the post link.",
  },
  {
    q: "Which platforms count?",
    a: "TikTok and Instagram Reels right now. We're working on YouTube Shorts - drop a note in the chat if that would unlock something for you.",
  },
  {
    q: "What needs to be in the video?",
    a: "Just feature nomi in the post - show the app, tag @nomi, and put your referral link in the bio or caption. We're not picky about the style, just that it's clearly recognisable.",
  },
  {
    q: "How long does verification take?",
    a: "Usually under 24 hours. We re-check view counts on day 7 and day 30 - credits are awarded based on the highest count we observe in those checks.",
  },
  {
    q: "Can I keep earning on the same video?",
    a: "Yes. If a single post crosses 50k, 100k, or 500k views over time, we keep crediting you in 10k-view increments up to a 1,000,000-view cap per post.",
  },
  {
    q: "Can I combine this with the affiliate program?",
    a: "Absolutely. Use your affiliate link in the bio so anyone who clicks and pays earns you 30% recurring on top of the credits.",
  },
]

const TIPS = [
  "Show the app on screen - recording your phone or capturing a clean screen capture both work.",
  "Hook in the first 2 seconds. \"I made 30 flashcards in 8 seconds\" beats \"hi guys today I'll show you\".",
  "Put your referral link in your bio so views convert into recurring affiliate earnings too.",
]

function detectPlatform(url: string): "tiktok" | "instagram" {
  return /instagram\.com/i.test(url) ? "instagram" : "tiktok"
}

export default function FreeCreditsPage() {
  const [link, setLink] = useState("")
  const queryClient = useQueryClient()

  const submissions = useQuery({
    queryKey: qk.creditPromoSubmissions(),
    queryFn: () => api.listCreditPromoSubmissions(),
    staleTime: 30_000,
  })

  const submitMutation = useMutation({
    mutationFn: (input: { postUrl: string; platform: "tiktok" | "instagram" }) =>
      api.submitCreditPromo(input),
    onSuccess: () => {
      setLink("")
      toast.success("Submitted - we'll verify and credit you within 24 hours")
      queryClient.invalidateQueries({ queryKey: qk.creditPromoSubmissions() })
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not submit. Try again in a moment.",
      )
    },
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = link.trim()
    if (!trimmed) return
    if (!/^https?:\/\//i.test(trimmed)) {
      toast.error("Please paste the full URL, starting with https://")
      return
    }
    submitMutation.mutate({
      postUrl: trimmed,
      platform: detectPlatform(trimmed),
    })
  }

  const recent = submissions.data ?? []

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-8 py-12">
      <header className="space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          <HugeiconsIcon icon={GiftIcon} strokeWidth={2} className="size-3.5" />
          Free credits program
        </span>
        <h1 className="font-display text-[44px] font-light leading-[1.05] tracking-[-0.02em]">
          Make a TikTok or Reel.
          <br />
          Get 100 credits per 10k views.
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Show people how you study with nomi. We'll top up your account with
          100 free credits for every 10,000 verified views your post gets - on
          TikTok or Instagram Reels.
        </p>
      </header>

      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
          <CreditMath />
          <ReelMockup />
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="font-display text-[28px] font-light tracking-[-0.02em]">
          How it works
        </h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          <Step
            n={1}
            title="Make the post"
            body="Show nomi in a TikTok or Instagram Reel. Tag @nomi and drop your referral link in the bio."
            icon={PlayCircleIcon}
          />
          <Step
            n={2}
            title="Submit the link"
            body="Paste the post URL below. We pick up the view count from TikTok or Instagram automatically."
            icon={Link02Icon}
          />
          <Step
            n={3}
            title="Watch credits land"
            body="100 credits per 10,000 views. We re-check on day 7 and day 30 in case your post keeps growing."
            icon={EyeIcon}
          />
        </ol>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6">
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="post-link" className="text-[13px] font-medium">
              Submit a post
            </Label>
            <p className="text-[12px] text-muted-foreground">
              Paste the public TikTok or Instagram Reel URL.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="post-link"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://www.tiktok.com/@you/video/…"
              className="flex-1"
              disabled={submitMutation.isPending}
            />
            <Button
              type="submit"
              disabled={!link.trim() || submitMutation.isPending}
            >
              <HugeiconsIcon
                icon={SparklesIcon}
                strokeWidth={2}
                className="size-4"
              />
              {submitMutation.isPending ? "Submitting…" : "Submit for review"}
            </Button>
          </div>
          {recent.length > 0 && (
            <SubmissionList submissions={recent} />
          )}
        </form>
      </section>

      <section className="space-y-5">
        <h2 className="font-display text-[28px] font-light tracking-[-0.02em]">
          Tips that actually work
        </h2>
        <ul className="space-y-2">
          {TIPS.map((t) => (
            <li
              key={t}
              className="flex items-start gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-[13px] text-foreground"
            >
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                strokeWidth={2}
                className="mt-0.5 size-3.5 shrink-0"
              />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-5">
        <h2 className="font-display text-[28px] font-light tracking-[-0.02em]">
          Frequently asked
        </h2>
        <Accordion defaultValue={[FAQ[0]!.q]}>
          {FAQ.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">{item.a}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  )
}

function CreditMath() {
  const rows: Array<{ views: string; credits: string }> = [
    { views: "10,000", credits: "100" },
    { views: "50,000", credits: "500" },
    { views: "250,000", credits: "2,500" },
    { views: "1,000,000", credits: "10,000" },
  ]
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        The maths
      </p>
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-2.5 text-left text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Views
              </th>
              <th className="px-4 py-2.5 text-right text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Credits
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.views}
                className={cn(
                  "border-t border-border",
                  i === rows.length - 1 && "bg-foreground/[0.03]",
                )}
              >
                <td className="px-4 py-2.5 text-[13px] tabular-nums">
                  {row.views}
                </td>
                <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                  {row.credits}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] text-muted-foreground">
        That's enough for ~10 summaries, 20 flashcard sets, or 200 chat
        messages on the free plan - every time your post crosses another 10k.
      </p>
    </div>
  )
}

function ReelMockup() {
  return (
    <div className="relative isolate flex items-center justify-center">
      <div className="relative h-[260px] w-[150px] rotate-[-3deg] overflow-hidden rounded-[28px] border border-border bg-foreground text-background shadow-xl ring-1 ring-foreground/5">
        <div className="absolute inset-0 flex flex-col items-center justify-end gap-3 bg-gradient-to-b from-foreground/40 via-foreground to-foreground p-4">
          <div className="flex w-full items-center gap-2">
            <div className="size-7 rounded-full bg-background/20" />
            <div className="flex-1 space-y-1">
              <div className="h-2 w-16 rounded-full bg-background/40" />
              <div className="h-1.5 w-10 rounded-full bg-background/20" />
            </div>
          </div>
          <div className="flex w-full items-center justify-between text-[10px] font-medium">
            <span className="flex items-center gap-1">
              <HugeiconsIcon
                icon={EyeIcon}
                strokeWidth={2}
                className="size-3"
              />
              48.2k
            </span>
            <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold text-foreground">
              +480 credits
            </span>
          </div>
        </div>
      </div>
      <div className="absolute -right-3 top-3 flex size-12 rotate-[8deg] items-center justify-center rounded-2xl bg-card text-foreground shadow-md ring-1 ring-border">
        <HugeiconsIcon
          icon={TiktokIcon}
          strokeWidth={2}
          className="size-5"
        />
      </div>
      <div className="absolute -left-1 bottom-3 flex size-10 -rotate-[10deg] items-center justify-center rounded-2xl bg-card text-foreground shadow-md ring-1 ring-border">
        <HugeiconsIcon
          icon={InstagramIcon}
          strokeWidth={2}
          className="size-5"
        />
      </div>
    </div>
  )
}

function SubmissionList({
  submissions,
}: {
  submissions: CreditPromoSubmission[]
}) {
  return (
    <div className="space-y-2 border-t border-border pt-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Your submissions
      </p>
      <ul className="space-y-1.5">
        {submissions.slice(0, 5).map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2 text-[12px]"
          >
            <a
              href={s.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 truncate text-foreground hover:underline"
            >
              {s.postUrl}
            </a>
            <SubmissionStatus
              status={s.status}
              creditsAwarded={s.creditsAwarded}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

function SubmissionStatus({
  status,
  creditsAwarded,
}: {
  status: CreditPromoSubmission["status"]
  creditsAwarded: number
}) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-[11px] font-medium text-background">
        +{creditsAwarded} credits
      </span>
    )
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        Rejected
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      Pending review
    </span>
  )
}

type IconObject = Parameters<typeof HugeiconsIcon>[0]["icon"]

function Step({
  n,
  title,
  body,
  icon,
}: {
  n: number
  title: string
  body: string
  icon: IconObject
}) {
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-[12px] font-semibold text-background">
          {n}
        </span>
        <HugeiconsIcon
          icon={icon}
          strokeWidth={2}
          className="size-4 text-muted-foreground"
        />
      </div>
      <h3 className="text-[15px] font-medium">{title}</h3>
      <p className="text-[13px] text-muted-foreground">{body}</p>
    </li>
  )
}
