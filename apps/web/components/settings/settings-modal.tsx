"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import posthog from "posthog-js"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  Logout03Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"

import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { cn } from "@workspace/ui/lib/utils"

import { TIER_PRICING } from "@workspace/types/plan"
import {
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  type LanguageCode,
} from "@workspace/types/language"

import { api } from "@/lib/api"
import { signOut } from "@/lib/auth-client"
import { useMe, useUpdateMe, useUsage } from "@/lib/hooks/use-me"
import { qk } from "@/lib/query-keys"
import { triggerUpgradeModal } from "@/lib/upgrade-trigger"
import { LanguageCombobox } from "@/components/language-combobox"
import { PlanComparison } from "@/components/free-tier/plan-comparison"

type Tab = "account" | "plan"

export function SettingsModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [tab, setTab] = useState<Tab>("account")
  const me = useMe()
  const router = useRouter()

  async function handleSignOut() {
    posthog.capture("user_logged_out")
    await signOut()
    posthog.reset()
    router.push("/login")
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!h-[min(640px,90dvh)] !max-h-[90dvh] !max-w-[calc(100%-1rem)] overflow-hidden p-0 sm:!max-w-[960px] sm:!h-[min(640px,75vh)] sm:!max-h-[75vh]">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[200px_1fr]">
          <aside className="shrink-0 border-b border-border p-3 md:border-b-0 md:border-r md:bg-muted/30 md:p-4">
            <p className="hidden px-2 pb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground md:block">
              Settings
            </p>
            <div className="flex gap-1 overflow-x-auto md:flex-col md:gap-0">
              <TabButton
                active={tab === "account"}
                onClick={() => setTab("account")}
                label="Account"
              />
              <TabButton
                active={tab === "plan"}
                onClick={() => setTab("plan")}
                label="Plan & usage"
              />
            </div>
          </aside>

          <section className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            {tab === "account" && (
              <AccountTab me={me.data} onSignOut={handleSignOut} />
            )}
            {tab === "plan" && <PlanTab />}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] md:block md:w-full md:rounded-md md:px-2.5 md:text-left",
        active
          ? "bg-foreground text-background"
          : "text-foreground/80 hover:bg-foreground/5",
      )}
    >
      {label}
    </button>
  )
}

function AccountTab({
  me,
  onSignOut,
}: {
  me: ReturnType<typeof useMe>["data"]
  onSignOut: () => void
}) {
  const initial = (me?.name ?? me?.email ?? "?").trim().charAt(0).toUpperCase()
  const tierLabel = me?.subscriptionTier
    ? TIER_PRICING[me.subscriptionTier].intervalLabel
    : null
  const planLabel =
    me?.plan === "pro" && tierLabel ? `Pro · ${tierLabel}` : me?.plan ?? "free"
  const language = normalizeLanguage(me?.language ?? DEFAULT_LANGUAGE)
  const updateMe = useUpdateMe()

  function changeLanguage(next: LanguageCode) {
    if (next === language) return
    updateMe.mutate(
      { language: next },
      {
        onError: (err) => {
          const msg = err instanceof Error ? err.message : "Failed to save language"
          toast.error(msg)
        },
      },
    )
  }

  return (
    <div>
      <h2 className="font-display text-[22px] font-light tracking-[-0.02em]">
        Account
      </h2>

      <div className="mt-6 flex items-center gap-4">
        <UserAvatar
          name={me?.name ?? me?.email ?? initial}
          size={56}
        />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium">
            {me?.name ?? "-"}
          </p>
          <p className="truncate text-[13px] text-muted-foreground">
            {me?.email ?? "-"}
          </p>
        </div>
      </div>

      <dl className="mt-8 space-y-4 border-t border-border pt-6 text-[13px]">
        <Row label="Content language">
          <LanguageCombobox
            value={language}
            onChange={changeLanguage}
            disabled={updateMe.isPending || !me}
            size="sm"
            align="end"
          />
        </Row>
        <p className="-mt-2 text-[12px] text-muted-foreground">
          Used as the default for every summary, flashcard, quiz, and mindmap you generate.
        </p>
        <Row label="Plan">
          <span className="font-medium uppercase tracking-[0.04em]">
            {planLabel}
          </span>
        </Row>
        {me?.subscriptionStatus && me.subscriptionStatus !== "active" && (
          <Row label="Status">
            <span className="font-medium uppercase tracking-[0.04em]">
              {me.subscriptionStatus.replace("_", " ")}
            </span>
          </Row>
        )}
        {me?.subscriptionCurrentPeriodEnd && (
          <Row label="Renews on">
            <span>
              {new Date(me.subscriptionCurrentPeriodEnd).toLocaleDateString(
                undefined,
                { month: "short", day: "numeric", year: "numeric" },
              )}
            </span>
          </Row>
        )}
        <Row label="Member since">
          <span>
            {me?.createdAt
              ? new Date(me.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "-"}
          </span>
        </Row>
      </dl>

      <div className="mt-8 flex justify-end">
        <Button variant="outline" size="sm" onClick={onSignOut}>
          <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} className="size-4" />
          Sign out
        </Button>
      </div>
    </div>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  )
}

function PlanTab() {
  const me = useMe()
  const usage = useUsage()
  const qc = useQueryClient()
  const isPro = usage.data?.plan === "pro"
  const credits = usage.data?.credits ?? null
  const tier = me.data?.subscriptionTier ?? null
  const status = me.data?.subscriptionStatus ?? null
  const periodEnd = me.data?.subscriptionCurrentPeriodEnd ?? null
  const pricing = tier ? TIER_PRICING[tier] : null

  const cancelMutation = useMutation({
    mutationFn: () => api.cancelSubscription(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.me() })
      qc.invalidateQueries({ queryKey: qk.subscription() })
      toast.success("Membership cancelled - access continues until period end")
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Failed to cancel"
      toast.error(msg)
    },
  })

  function handleCancel() {
    if (!window.confirm("Cancel your membership? You'll keep Pro access until the end of the current billing period.")) return
    cancelMutation.mutate()
  }

  return (
    <div>
      <h2 className="font-display text-[22px] font-light tracking-[-0.02em]">
        Plan & usage
      </h2>

      {!isPro && <UpgradeNudge />}

      <div className="mt-8 space-y-4">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {isPro ? "Your plan" : "Your credits"}
        </p>
        {usage.isLoading && (
          <p className="text-[13px] text-muted-foreground">Loading…</p>
        )}
        {!usage.isLoading && isPro && pricing && (
          <div className="space-y-3">
            <p className="text-[13px]">
              <span className="font-medium">Pro</span>
              <span className="text-muted-foreground">
                {" "}
                · {pricing.intervalLabel} · {pricing.priceLabel}/{pricing.cadenceLabel.replace("per ", "")}
              </span>
            </p>
            {periodEnd && status === "active" && (
              <p className="text-[13px] text-muted-foreground">
                Renews on{" "}
                <span className="text-foreground">
                  {new Date(periodEnd).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </p>
            )}
            {periodEnd && status === "cancelled" && (
              <p className="text-[13px] text-muted-foreground">
                Cancelled - access until{" "}
                <span className="text-foreground">
                  {new Date(periodEnd).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </p>
            )}
            {status === "active" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="h-8 text-[13px] text-muted-foreground"
              >
                {cancelMutation.isPending ? "Cancelling…" : "Cancel membership"}
              </Button>
            )}
          </div>
        )}
        {!usage.isLoading && isPro && !pricing && (
          <p className="text-[13px] font-medium">Pro</p>
        )}
        {!usage.isLoading && !isPro && credits && (
          <CreditPoolRow
            balance={credits.balance}
            granted={credits.lifetimeGranted}
            consumed={credits.lifetimeConsumed}
          />
        )}
      </div>

      <div className="mt-10 space-y-3">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Plan limits
        </p>
        <PlanComparison />
      </div>
    </div>
  )
}

function CreditPoolRow({
  balance,
  granted,
  consumed,
}: {
  balance: number
  granted: number
  consumed: number
}) {
  const denominator = Math.max(granted, 1)
  const pct = Math.min(100, Math.round((consumed / denominator) * 100))
  const exhausted = balance <= 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-medium">Credits</span>
        <span className="tabular-nums text-muted-foreground">
          {balance}
          <span className="text-foreground/40"> / {granted}</span>
          <span className="ml-1 text-[11px] uppercase tracking-[0.08em]">
            available
          </span>
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        1 credit per AI action - summary, flashcards, quiz, mindmap, course,
        transcription, or chat message.
        {exhausted &&
          " You're out of credits - upgrade or earn more from /free-credits."}
      </p>
    </div>
  )
}

function UpgradeNudge() {
  const features = [
    "Unlimited summaries, flashcards, quizzes, mindmaps",
    "Unlimited tutor chat across all your notebooks",
    "Larger uploads (up to 100 MB) and longer PDFs",
    "Higher question counts on flashcards and quizzes",
  ]
  return (
    <div className="mt-6 rounded-[12px] border border-border bg-card p-5 shadow-hairline">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
          <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[18px] font-light tracking-[-0.02em]">
            Get more out of nomi
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Free is great for trying things out. Pro unlocks the workspace at full speed.
          </p>
          <ul className="mt-4 space-y-1.5">
            {features.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2 text-[13px] text-foreground"
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  strokeWidth={2}
                  className="mt-0.5 size-3.5 text-foreground"
                />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <Button
              size="sm"
              className="h-8 px-4 text-[13px]"
              onClick={() => triggerUpgradeModal({ kind: "manual" })}
            >
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
