"use client"

import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

export default function BillingCancelPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center px-6 py-12 text-center">
      <h1 className="font-display text-[32px] font-light leading-[1.17] tracking-[-0.02em]">
        Checkout cancelled
      </h1>
      <p className="mt-3 text-[14px] text-muted-foreground">
        No charge was made. You can pick a plan whenever you're ready.
      </p>
      <div className="mt-8 flex gap-3">
        <Button size="sm" render={<Link href="/home" />}>
          Back to workspace
        </Button>
      </div>
    </main>
  )
}
