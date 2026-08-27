"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"

import type { DiscountInfo } from "@/lib/api"

function getIstRemaining(cycleHours: number): number {
  const now = new Date()
  const ist = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  )
  const msInCycle = cycleHours * 3600 * 1000
  const elapsed = ist.getTime() % msInCycle
  return Math.max(0, Math.floor((msInCycle - elapsed) / 1000))
}

function formatTimer(totalSec: number): string {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function DiscountBar() {
  const [discount, setDiscount] = useState<DiscountInfo | null>(null)
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    fetch("/api/discount")
      .then((r) => {
        if (!r.ok) return null
        return r.json() as Promise<DiscountInfo | null>
      })
      .then((d) => {
        if (d) {
          setDiscount(d)
          setRemaining(getIstRemaining(d.time))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!discount) return
    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = getIstRemaining(discount.time)
        if (next <= 0) return discount.time * 3600
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [discount])

  const handleCopy = useCallback(() => {
    if (!discount) return
    navigator.clipboard.writeText(discount.code).then(
      () => toast.success("Discount code copied!"),
      () => toast.error("Failed to copy"),
    )
  }, [discount])

  if (!discount) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-[#e8def8] py-2.5">
      <div className="mx-auto flex max-w-[1200px] items-center justify-center gap-4 px-5 sm:px-8">
        <span className="text-[13px] font-semibold text-[#4a3f6b] sm:text-[14px]">
          {discount.title}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-pill bg-[#d4c4f0] px-3.5 py-1.5 text-[13px] font-bold tracking-[0.04em] text-[#4a3f6b] transition hover:bg-[#c4b0e8] sm:text-[14px]"
        >
          {discount.code}
        </button>
        <span className="font-mono text-[14px] font-medium tabular-nums text-[#4a3f6b]">
          {formatTimer(remaining)}
        </span>
      </div>
    </div>
  )
}
