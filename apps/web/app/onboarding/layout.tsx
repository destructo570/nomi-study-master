import { RequireAuth } from "@/components/auth/require-auth"
import { UpgradeModalProvider } from "@/components/upgrade/upgrade-modal"

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RequireAuth>
      <main className="min-h-screen">{children}</main>
      <UpgradeModalProvider />
    </RequireAuth>
  )
}
