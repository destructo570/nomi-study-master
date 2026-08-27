"use client"

import Link from "next/link"
import { Suspense, useEffect } from "react"
import posthog from "posthog-js"
import { useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { qk } from "@/lib/query-keys"

function BillingSuccessContent() {
  const qc = useQueryClient()
  const search = useSearchParams()

  useEffect(() => {
    posthog.capture("billing_success_viewed", {
      tier: search.get("tier"),
    })
    // Webhook may take a few seconds to land - invalidate after a short delay
    // so /me reflects the new tier when the user clicks through.
    const t = setTimeout(() => {
      qc.invalidateQueries({ queryKey: qk.me() })
      qc.invalidateQueries({ queryKey: qk.usage() })
      qc.invalidateQueries({ queryKey: qk.subscription() })
    }, 1500)
    return () => clearTimeout(t)
  }, [qc, search])

  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-foreground text-background">
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          strokeWidth={2}
          className="size-6"
        />
      </span>
      <h1 className="mt-6 font-display text-[32px] font-light leading-[1.17] tracking-[-0.02em]">
        You're in. Welcome to Pro.
      </h1>
      <p className="mt-3 text-[14px] text-muted-foreground">
        Your subscription is being activated. It can take up to a minute for
        your account to update.
      </p>
      <div className="mt-8 flex gap-3">
        <Button size="sm" render={<Link href="/home" />}>
          Go to workspace
        </Button>
      </div>
    </main>
  )
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={null}>
      <BillingSuccessContent />
    </Suspense>
  )
}
