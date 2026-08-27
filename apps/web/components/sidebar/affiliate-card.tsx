"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"

export function AffiliateCard() {
  return (
    <Link
      href="/affiliate"
      className="group flex items-center gap-2.5 rounded-xl border border-border bg-background p-2.5 transition-colors hover:border-foreground/20 hover:bg-accent/40"
    >
      <span className="flex size-8 shrink-0 items-center justify-center">
        <DotLottieReact
          src="/icons/anim/coin-icon-3d.lottie"
          autoplay
          loop
          className="size-8"
        />
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[13px] font-semibold">
          Invite &amp; Earn
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          Earn 30% commission as an Affiliate
        </p>
      </div>
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        strokeWidth={2}
        className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
      />
    </Link>
  )
}
