import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Billing",
  robots: { index: false, follow: false, nocache: true },
}

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
