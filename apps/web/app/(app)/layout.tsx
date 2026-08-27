import type { Metadata } from "next"

import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar"

import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { RequireAuth } from "@/components/auth/require-auth"
import { UpgradeModalProvider } from "@/components/upgrade/upgrade-modal"

export const metadata: Metadata = {
  title: {
    default: "nomi",
    template: "%s · nomi",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RequireAuth>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <AppHeader />
          <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
        </SidebarInset>
        <UpgradeModalProvider />
      </SidebarProvider>
    </RequireAuth>
  )
}
