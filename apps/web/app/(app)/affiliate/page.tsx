"use client"

import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  Copy01Icon,
  Money02Icon,
  UserGroup03Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"

import { useMe } from "@/lib/hooks/use-me"

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "How much do I earn?",
    a: "30% of every paying customer you refer. It applies to their first payment and every renewal - for as long as they stay on a paid plan.",
  },
  {
    q: "Is the 30% really for life?",
    a: "Yes. As long as the customer you referred remains subscribed, you keep earning 30% of what they pay each billing cycle.",
  },
  {
    q: "When do I get paid?",
    a: "We pay out once a month, on the first business day of the following month. Earnings under $20 roll over until you cross the threshold.",
  },
  {
    q: "How do I track my referrals?",
    a: "Your affiliate dashboard shows live click counts, sign-ups, conversions, and payout history. You'll get an email summary every month.",
  },
  {
    q: "Are there any restrictions?",
    a: "You can't bid on our brand keywords (like \"nomi\") in paid search, run incentivised traffic, or self-refer. Otherwise - promote it however you like.",
  },
  {
    q: "How do payouts work?",
    a: "We pay via PayPal, UPI (India), or wire. Pick your preferred method on the affiliate dashboard once you have your first conversion.",
  },
]

export default function AffiliatePage() {
  const me = useMe()
  const referralLink = me.data
    ? `https://www.nomistudy.com/?ref=${me.data.userId.slice(0, 8)}`
    : "https://www.nomistudy.com/?ref=…"

  function copyLink() {
    if (!me.data) return
    navigator.clipboard
      .writeText(referralLink)
      .then(() => toast.success("Referral link copied"))
      .catch(() => toast.error("Couldn't copy - try again"))
  }

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-8 py-12">
      <header className="space-y-4">
        <h1 className="font-display text-[44px] font-light leading-[1.05] tracking-[-0.02em]">
          Earn 30% commission for life
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Share nomi with your audience or your friends. Every paying customer
          you bring in earns you 30% of what they pay - every month, for as long
          as they stay subscribed.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={Money02Icon}
          headline="30%"
          subline="of every paid invoice"
        />
        <StatCard
          icon={UserGroup03Icon}
          headline="Lifetime"
          subline="for as long as they're paying"
        />
        <StatCard
          icon={Calendar03Icon}
          headline="Monthly"
          subline="payouts on the 1st"
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Your referral link
            </p>
            <p className="text-[13px] text-foreground">
              Share this anywhere. We attribute every signup that comes from it.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyLink}
            disabled={!me.data}
          >
            <HugeiconsIcon
              icon={Copy01Icon}
              strokeWidth={2}
              className="size-4"
            />
            Copy link
          </Button>
        </div>
        <code className="block break-all rounded-md border border-border bg-background px-3 py-2.5 font-mono text-[13px] text-foreground">
          {referralLink}
        </code>
      </section>

      <section className="space-y-5">
        <h2 className="text-center font-display text-[32px] font-normal leading-[1.08] tracking-[-0.02em] sm:text-[40px]">
          How it works
        </h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          <Step
            n={1}
            title="Share your link"
            body="Drop it in your newsletter, on TikTok, in a Discord - wherever your audience hangs out."
            cardBg="bg-[#fde4d3]/35"
            cardBorder="border-[#f1d2b8]"
            badgeBg="bg-[#f7c9a8]"
            badgeText="text-[#7a3f1a]"
          />
          <Step
            n={2}
            title="They sign up"
            body="When someone clicks your link and upgrades to a paid plan, the conversion is attributed to you automatically."
            cardBg="bg-[#dde7fb]/35"
            cardBorder="border-[#c9d6f1]"
            badgeBg="bg-[#bccdf3]"
            badgeText="text-[#1f3974]"
          />
          <Step
            n={3}
            title="You get paid"
            body="30% of every payment they make lands in your payout balance. We send it on the 1st of every month."
            cardBg="bg-[#dcefdc]/35"
            cardBorder="border-[#c4dec4]"
            badgeBg="bg-[#bcdcbb]"
            badgeText="text-[#274f29]"
          />
        </ol>
      </section>

      <section>
        <h2 className="text-center font-display text-[32px] font-normal leading-[1.08] tracking-[-0.02em] sm:text-[40px]">
          Affiliate program FAQs
        </h2>
        <div className="mt-10 divide-y divide-border rounded-[16px] bg-[#f8f8f9] px-6 sm:mt-12 sm:px-8">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group py-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[16px] font-medium text-foreground sm:text-[17px]">
                <span>{item.q}</span>
                <span
                  aria-hidden
                  className="mt-1 inline-flex size-5 shrink-0 items-center justify-center text-foreground transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 pr-10 text-[15px] leading-[1.6] text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-center text-[13px] text-muted-foreground">
          Didn't find your answer? Email us at{" "}
          <a
            href="mailto:getnomi@proton.me"
            className="text-foreground underline underline-offset-4 hover:opacity-70"
          >
            getnomi@proton.me
          </a>{" "}
          and we'll get back to you.
        </p>
      </section>

    </div>
  )
}

type IconObject = Parameters<typeof HugeiconsIcon>[0]["icon"]

function StatCard({
  icon,
  headline,
  subline,
}: {
  icon: IconObject
  headline: string
  subline: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-foreground text-background">
        <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
      </span>
      <p className="mt-4 font-display text-[32px] font-light leading-none tracking-[-0.02em]">
        {headline}
      </p>
      <p className="mt-1.5 text-[13px] text-muted-foreground">{subline}</p>
    </div>
  )
}

function Step({
  n,
  title,
  body,
  cardBg,
  cardBorder,
  badgeBg,
  badgeText,
}: {
  n: number
  title: string
  body: string
  cardBg: string
  cardBorder: string
  badgeBg: string
  badgeText: string
}) {
  return (
    <li
      className={`flex flex-col gap-2 rounded-2xl border p-5 ${cardBg} ${cardBorder}`}
    >
      <span
        className={`flex size-7 items-center justify-center rounded-full text-[12px] font-semibold ${badgeBg} ${badgeText}`}
      >
        {n}
      </span>
      <h3 className="text-[15px] font-medium">{title}</h3>
      <p className="text-[13px] text-muted-foreground">{body}</p>
    </li>
  )
}
