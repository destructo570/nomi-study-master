import Link from "next/link"

import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { ArkiveLogo } from "@/components/app-sidebar"

type LegalPageProps = {
  title: string
  effectiveDate: string
  lastUpdated?: string
  children: React.ReactNode
}

export function LegalPage({
  title,
  effectiveDate,
  lastUpdated,
  children,
}: LegalPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2">
            <ArkiveLogo className="size-6 text-foreground" />
            <span className="font-display text-xl font-bold tracking-tight">
              nomi
            </span>
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
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pt-12 pb-20 sm:px-8 sm:pt-16 sm:pb-28">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Legal
        </p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          {title}
        </h1>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span>
            Effective{" "}
            <span className="text-foreground">{effectiveDate}</span>
          </span>
          {lastUpdated && (
            <span>
              Last updated{" "}
              <span className="text-foreground">{lastUpdated}</span>
            </span>
          )}
        </div>

        <div className="mt-10 h-px bg-border" />

        <article className="legal-prose mt-10">{children}</article>

        <div className="mt-16 h-px bg-border" />

        <p className="mt-6 text-sm text-muted-foreground">
          Questions? Email us at{" "}
          <a
            href="mailto:getnomi@proton.me"
            className="text-foreground underline underline-offset-4 hover:opacity-70"
          >
            getnomi@proton.me
          </a>
          .
        </p>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-3xl flex-col items-start justify-between gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-8">
          <div className="flex items-center gap-2">
            <ArkiveLogo className="size-5" />
            <span className="font-display text-base font-bold text-foreground">
              nomi
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <span className="text-xs">
              © {new Date().getFullYear()} nomi
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
