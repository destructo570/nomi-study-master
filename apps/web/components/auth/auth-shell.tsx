"use client"

import Link from "next/link"
import Image from "next/image"
import { cn } from "@workspace/ui/lib/utils"

import { ArkiveLogo } from "@/components/app-sidebar"

const PILL_HEADING =
  "font-brand font-bold tracking-[-0.02em] leading-[1.08]"

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="h-screen max-h-screen overflow-hidden bg-background text-foreground">
      <div className="grid h-full md:grid-cols-2">
        {/* Left - form */}
        <div className="flex h-full flex-col overflow-y-auto">
          <header className="flex w-full shrink-0 items-center px-6 py-4">
            <Link href="/" className="flex items-center gap-2">
              <ArkiveLogo className="size-[28px] text-foreground sm:size-[30px]" />
              <span className="font-brand text-[20px] leading-none font-bold tracking-tight">
                nomi
              </span>
            </Link>
          </header>

          <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-6 pt-4 pb-8">
            <h1 className={cn(PILL_HEADING, "text-center text-[32px] sm:text-[36px]")}>
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-center text-[14px] leading-[1.5] text-muted-foreground">
                {subtitle}
              </p>
            )}

            <div className="mt-6">{children}</div>

            <p className="mt-5 text-center text-[13px] leading-[1.5] text-muted-foreground">
              By continuing, you agree to our{" "}
              <Link
                href="/terms"
                className="text-foreground underline underline-offset-4 hover:opacity-70"
              >
                terms of service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-foreground underline underline-offset-4 hover:opacity-70"
              >
                privacy policy
              </Link>
              .
            </p>

            {footer && (
              <div className="mt-5 text-center text-[13px] text-muted-foreground">
                {footer}
              </div>
            )}
          </main>
        </div>

        {/* Right - image */}
        <div className="relative hidden md:block">
          <div className="absolute top-5 right-3 bottom-5 left-0 overflow-hidden rounded-[8px]">
            <Image
              src="/images/nomi_chemistry_banner.webp"
              alt=""
              fill
              priority
              className="object-cover"
            />
            <span className="font-brand absolute right-6 bottom-3 flex items-center gap-2 text-[28px] leading-none font-bold tracking-tight text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
              <ArkiveLogo className="size-[28px] sm:size-[30px]" />
              nomi
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.15-4.53H2.17v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.35-2.11V7.05H2.17A11 11 0 0 0 1 12c0 1.78.43 3.46 1.17 4.95l3.68-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.16-3.16C17.45 2.04 14.97 1 12 1A11 11 0 0 0 2.17 7.05l3.68 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  )
}
