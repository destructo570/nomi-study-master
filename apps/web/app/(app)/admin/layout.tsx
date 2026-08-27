"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { useMe } from "@/lib/hooks/use-me"
import { cn } from "@workspace/ui/lib/utils"

type AdminNavItem = { href: string; label: string; exact?: boolean }

const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/credits", label: "Credits" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/admin/llm-test", label: "LLM Test" },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const me = useMe()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (me.data && me.data.role !== "admin") {
      router.replace("/home")
    }
  }, [me.data, router])

  if (!me.data) {
    return (
      <div className="px-8 py-12 text-[13px] text-muted-foreground">
        Loading…
      </div>
    )
  }
  if (me.data.role !== "admin") return null

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-6 md:gap-10 md:px-8 md:py-10">
      <aside className="hidden w-48 shrink-0 md:block">
        <div className="sticky top-6 space-y-1">
          <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Admin
          </p>
          <nav className="flex flex-col gap-0.5">
            {ADMIN_NAV.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-[13px] transition-colors",
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <nav className="-mx-1 mb-4 flex gap-1 overflow-x-auto pb-2 md:hidden">
          {ADMIN_NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-[12px] transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        {children}
      </div>
    </div>
  )
}
