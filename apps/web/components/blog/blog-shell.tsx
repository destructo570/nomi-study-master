import Link from "next/link"

import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { ArkiveLogo } from "@/components/app-sidebar"

type BlogShellProps = {
  children: React.ReactNode
}

export function BlogShell({ children }: BlogShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[920px] items-center justify-between px-5 py-3 sm:px-8">
          <Link href="/" className="flex items-center gap-2">
            <ArkiveLogo className="size-6 text-foreground" />
            <span className="font-display text-xl font-bold tracking-tight">
              nomi
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/blog"
              className="text-[13px] font-medium text-muted-foreground hover:text-foreground"
            >
              Blog
            </Link>
            <Link
              href="/home"
              className={cn(
                buttonVariants({ size: "sm" }),
                "h-9 rounded-full px-4 text-sm",
              )}
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[920px] flex-1 px-5 pt-12 pb-20 sm:px-8 sm:pt-16 sm:pb-28">
        {children}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[920px] flex-col items-start justify-between gap-3 px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-8">
          <div className="flex items-center gap-2">
            <ArkiveLogo className="size-5" />
            <span className="font-display text-base font-bold text-foreground">
              nomi
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <Link href="/blog" className="hover:text-foreground">
              Blog
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <span className="text-xs">© {new Date().getFullYear()} nomi</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
