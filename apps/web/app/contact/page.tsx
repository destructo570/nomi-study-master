import type { Metadata } from "next"
import Link from "next/link"

import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { ArkiveLogo } from "@/components/app-sidebar"

const SITE_URL = "https://www.nomistudy.com"
const SUPPORT_EMAIL = "getnomi@proton.me"
const DISCORD_INVITE_URL =
  process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ?? "https://discord.gg/nomi"

export const metadata: Metadata = {
  title: "Contact nomi",
  description:
    "Get in touch with the nomi team - support, feedback, partnerships, and privacy requests. Email us or join the community on Discord.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact nomi",
    description:
      "Get in touch with the nomi team - support, feedback, partnerships, and privacy requests.",
    url: `${SITE_URL}/contact`,
    type: "website",
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: "Contact nomi" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact nomi",
    description:
      "Get in touch with the nomi team - support, feedback, partnerships, and privacy requests.",
    images: [`${SITE_URL}/opengraph-image`],
  },
  robots: { index: true, follow: true },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact nomi",
  url: `${SITE_URL}/contact`,
  description:
    "Get in touch with the nomi team - support, feedback, partnerships, and privacy requests.",
  mainEntity: {
    "@type": "Organization",
    name: "nomi",
    url: SITE_URL,
    email: SUPPORT_EMAIL,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: SUPPORT_EMAIL,
        availableLanguage: ["English"],
      },
    ],
  },
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2">
            <ArkiveLogo className="size-6 text-foreground" />
            <span className="font-display text-xl font-bold tracking-tight">
              nomi
            </span>
          </Link>
          <Link
            href="/signup"
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
          Contact
        </p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          Talk to the nomi team
        </h1>
        <p className="mt-4 max-w-2xl text-[16px] leading-[1.6] text-muted-foreground sm:text-[18px]">
          Questions, feedback, partnership ideas, or privacy requests - we read
          everything. Pick whichever channel works best for you.
        </p>

        <div className="mt-10 h-px bg-border" />

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="group flex flex-col rounded-2xl border border-border p-6 transition hover:border-foreground/30"
          >
            <h2 className="font-display text-[20px] font-semibold tracking-tight">
              Email
            </h2>
            <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">
              The best way to reach us for support, account or billing questions,
              and privacy or data requests.
            </p>
            <span className="mt-4 text-[15px] font-medium text-foreground group-hover:underline group-hover:underline-offset-4">
              {SUPPORT_EMAIL}
            </span>
          </a>

          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col rounded-2xl border border-border p-6 transition hover:border-foreground/30"
          >
            <h2 className="font-display text-[20px] font-semibold tracking-tight">
              Community
            </h2>
            <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">
              Join the nomi Discord for product updates, study tips, feature
              requests, and to talk to other learners.
            </p>
            <span className="mt-4 text-[15px] font-medium text-foreground group-hover:underline group-hover:underline-offset-4">
              Join Discord →
            </span>
          </a>
        </div>

        <div className="mt-10 h-px bg-border" />

        <p className="mt-6 text-sm text-muted-foreground">
          Looking for something else? Browse the{" "}
          <Link href="/blog" className="text-foreground underline underline-offset-4 hover:opacity-70">
            blog
          </Link>{" "}
          or read our{" "}
          <Link href="/privacy" className="text-foreground underline underline-offset-4 hover:opacity-70">
            privacy policy
          </Link>
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
