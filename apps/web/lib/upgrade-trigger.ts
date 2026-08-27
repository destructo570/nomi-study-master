"use client"

export type UpgradeReason =
  | { kind: "notebook_limit"; limit: number }
  | { kind: "quota_exceeded"; action?: string; label?: string }
  | { kind: "pro_only"; feature: string }
  | { kind: "manual" }

const EVENT = "arkive:upgrade-required"

export function triggerUpgradeModal(reason: UpgradeReason) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<UpgradeReason>(EVENT, { detail: reason }))
}

export function subscribeUpgradeModal(
  handler: (reason: UpgradeReason) => void,
): () => void {
  if (typeof window === "undefined") return () => {}
  const listener = (e: Event) => {
    const detail = (e as CustomEvent<UpgradeReason>).detail
    if (detail) handler(detail)
  }
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}
