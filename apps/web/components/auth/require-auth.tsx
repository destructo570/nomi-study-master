"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import posthog from "posthog-js"

import { useSession } from "@/lib/auth-client"

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isPending) return
    if (!session) {
      const next = encodeURIComponent(pathname || "/home")
      router.replace(`/login?next=${next}`)
      return
    }
    const user = session.user as {
      id: string
      email?: string | null
      name?: string | null
      plan?: string | null
    }
    if (posthog.get_distinct_id() !== user.id) {
      posthog.identify(user.id, {
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        plan: user.plan ?? undefined,
      })
    }
  }, [session, isPending, pathname, router])

  if (isPending || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-6 animate-pulse rounded-full bg-muted-foreground/30" />
      </div>
    )
  }

  return <>{children}</>
}
