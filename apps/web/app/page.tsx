"use client"

import { useEffect, useState, useCallback, useRef, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { motion, useInView } from "framer-motion"
import posthog from "posthog-js"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  ArrowDown01Icon,
  Mic01Icon,
  Brain01Icon,
  Cards01Icon,
  File01Icon,
  StickyNote02Icon,
  PodcastIcon,
  Presentation01Icon,
  AiVideoIcon,
  AiWebBrowsingIcon,
  HelpSquareIcon,
  AiChat01Icon,
  Mortarboard02Icon,
  Upload03Icon,
  Pdf01Icon,
  Doc01Icon,
  Ppt01Icon,
  Txt01Icon,
  Image01Icon,
  Video01Icon,
  Link01Icon,
} from "@hugeicons/core-free-icons"

import { buttonVariants } from "@workspace/ui/components/button"
import { InsetFrame } from "@workspace/ui/components/inset-frame"

import { PricingPanel } from "@/components/upgrade/plan-card"
import { DiscountBar } from "@/components/discount-bar"
import { UserAvatar } from "@/components/user-avatar"
import { TIER_PRICING } from "@workspace/types/plan"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"

import { ArkiveLogo } from "@/components/app-sidebar"
import { FeatureCard } from "@/components/landing/feature-card"
import { HelloBurst } from "@/components/landing/hello-burst"
import { MindmapPreview } from "@/components/landing/mindmap-preview"
import { PodcastWave } from "@/components/landing/podcast-wave"
import { AudioRecorder } from "@/components/landing/audio-recorder"
import { AiChat } from "@/components/landing/ai-chat"
import { useIsLg } from "@/hooks/use-is-lg"
import {
  LANGUAGES,
  TRANSLATIONS,
  type Dictionary,
  type Lang,
} from "./landing-translations"
import { TrustStrip } from "@/components/seo/trust-strip"
import { Testimonials } from "@/components/seo/testimonials"
import { SiteFooter } from "@/components/seo/site-footer"

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
}

const fadeUpStagger = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: {
    duration: 0.55,
    ease: [0.22, 1, 0.36, 1] as const,
    delay: i * 0.06,
  },
})

const PILL_HEADING =
  "font-display font-normal tracking-[-0.02em] leading-[1.08]"

const SITE_URL = "https://www.nomistudy.com"
const APP_DESCRIPTION =
  "AI study assistant that turns PDFs, lectures, and notes into flashcards, quizzes, summaries, mind maps, and a tutor grounded in your own study material."

const TESTIMONIAL_META = [
  { name: "Lin Wei", avatar: "bg-[#f4a78d]" },
  { name: "Ethan M.", avatar: "bg-[#9bb4d9]" },
  { name: "Mateo Ruiz", avatar: "bg-[#d8c19a]" },
  { name: "Camila Torres", avatar: "bg-[#a4c7b0]" },
  { name: "Wei Chen", avatar: "bg-[#c8a3c9]" },
  { name: "Leo Fischer", avatar: "bg-[#e6b07b]" },
  { name: "Maya F.", avatar: "bg-[#f0c6a8]" },
  { name: "Diego", avatar: "bg-[#b6c4e0]" },
]

const STORAGE_KEY = "nomi-landing-lang"

function SearchParamsTracker({ lang }: { lang: Lang }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    posthog.capture("landing_page_viewed", {
      lang,
      ref: searchParams.get("ref") ?? undefined,
      utm_source: searchParams.get("utm_source") ?? undefined,
      utm_medium: searchParams.get("utm_medium") ?? undefined,
      utm_campaign: searchParams.get("utm_campaign") ?? undefined,
    })
  }, [lang, searchParams])

  return null
}

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("en")
  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_KEY)
        : null
    if (saved && LANGUAGES.some((l) => l.code === saved)) {
      setLang(saved as Lang)
    } else if (typeof navigator !== "undefined") {
      const nav = navigator.language.slice(0, 2).toLowerCase()
      const match = LANGUAGES.find((l) => l.code === nav)
      if (match) setLang(match.code)
    }
  }, [])

  const changeLang = (next: Lang) => {
    setLang(next)
    if (typeof window !== "undefined")
      window.localStorage.setItem(STORAGE_KEY, next)
  }

  const trackCta = useCallback(
    (label: string, href: string) => {
      posthog.capture("landing_cta_clicked", { label, href, lang })
    },
    [lang]
  )

  const t = TRANSLATIONS[lang]

  const softwareAppLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "nomi",
    applicationCategory: "EducationApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description: APP_DESCRIPTION,
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        description:
          "AI flashcards, quizzes, and summaries from your own study material.",
      },
      {
        "@type": "Offer",
        name: "Weekly",
        price: String(TIER_PRICING.weekly.priceUsd),
        priceCurrency: "USD",
        description: TIER_PRICING.weekly.cadenceLabel,
      },
      {
        "@type": "Offer",
        name: "Monthly",
        price: String(TIER_PRICING.monthly.priceUsd),
        priceCurrency: "USD",
        description: TIER_PRICING.monthly.cadenceLabel,
      },
      {
        "@type": "Offer",
        name: "Yearly",
        price: String(TIER_PRICING.yearly.priceUsd),
        priceCurrency: "USD",
        description: TIER_PRICING.yearly.cadenceLabel,
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      bestRating: "5",
      worstRating: "1",
      reviewCount: String(t.testimonials.length),
    },
    review: t.testimonials.map((entry, i) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: TESTIMONIAL_META[i]?.name ?? "nomi user",
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: "5",
        bestRating: "5",
        worstRating: "1",
      },
      name: entry.headline,
      reviewBody: entry.quote,
    })),
  }

  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsTracker lang={lang} />
      </Suspense>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppLd) }}
      />
      <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
        <div
          aria-hidden="true"
          className="bg-[linear-gradient(to_top,#32373c,rgba(50, 55, 60, 0.29)_100%)] pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[700px]"
        />
        <div className="relative z-10">
          <TopNav
            t={t}
            lang={lang}
            onChangeLang={changeLang}
            trackCta={trackCta}
          />
          <Hero t={t} trackCta={trackCta} />
          <TrustStrip />
          <QuizletAlternative t={t} />
          {/*<StudyTools />*/}
          <HowItWorks />
          <FeaturesZigzag t={t} />
          {/*<MidCta t={t} trackCta={trackCta} />*/}
          <Testimonials />
          <Pricing t={t} />
          <Faq t={t} />
          <FinalCta t={t} trackCta={trackCta} />
          <LaunchedOn />
          <SiteFooter
            tagline={t.footer.tagline}
            copyright={t.footer.copyright}
            madeIn={t.footer.madeIn}
            extraColumns={t.footer.cols
              .filter((col) => col.items.some((item) => !HIDDEN_FOOTER_ITEMS.has(item)))
              .map((col) => ({
                title: col.title,
                items: col.items
                  .filter((item) => !HIDDEN_FOOTER_ITEMS.has(item))
                  .map((item) => ({
                    label: item,
                    href: footerHref(item),
                  })),
              }))}
          />
          <DiscountBar />
        </div>
      </div>
    </>
  )
}

/* ────────────────────────────────────────────────────────── Language dropdown */

function LanguageDropdown({
  lang,
  onChange,
}: {
  lang: Lang
  onChange: (l: Lang) => void
}) {
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Change language"
        className="inline-flex h-9 items-center gap-1.5 rounded-pill border border-border bg-background/85 px-3 text-[13px] font-medium text-foreground/80 transition hover:text-foreground sm:h-10"
      >
        <span className="text-[15px] leading-none">{current.flag}</span>
        <span className="tracking-wide">{current.label}</span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          className="size-3.5 opacity-70"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-[160px]">
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => onChange(l.code)}
            className="flex items-center gap-2"
          >
            <span className="text-[15px] leading-none">{l.flag}</span>
            <span className="flex-1 text-[13px]">{l.name}</span>
            <span className="text-[11px] tracking-wide text-muted-foreground">
              {l.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ────────────────────────────────────────────────────────── Top nav */

function TopNav({
  t,
  lang,
  onChangeLang,
  trackCta,
}: {
  t: Dictionary
  lang: Lang
  onChangeLang: (l: Lang) => void
  trackCta: (label: string, href: string) => void
}) {
  const links = [
    { label: t.nav.features, href: "#features" },
    { label: t.nav.pricing, href: "#pricing" },
    { label: t.nav.blog, href: "/blog" },
  ]

  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky z-30 transition-all duration-200 ease-out",
        scrolled ? "top-4 px-4 sm:top-5 sm:px-6" : "top-0 px-0"
      )}
    >
      <div
        className={cn(
          "relative mx-auto flex h-12 w-full items-center justify-between gap-3 transition-all duration-200 ease-out sm:h-14",
          scrolled
            ? "max-w-[960px] rounded-pill bg-background/85 pr-1.5 pl-4 shadow-hairline backdrop-blur sm:pr-2 sm:pl-5"
            : "max-w-[1200px] rounded-none border-b-0 bg-background px-5 sm:px-8"
        )}
      >
        <Link href="/" className="flex items-center gap-2" aria-label="Nomi">
          <ArkiveLogo className="size-[28px] text-foreground sm:size-[30px]" />
          <span className="font-brand text-[20px] leading-none font-bold tracking-tight">
            nomi
          </span>
        </Link>

        <nav className="absolute left-[calc(50%-10px)] hidden -translate-x-1/2 items-center gap-1 md:flex">
          {links.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="rounded-pill px-3 py-1.5 text-[14px] font-medium text-foreground/80 transition hover:bg-foreground/5 hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageDropdown lang={lang} onChange={onChangeLang} />
          <Link
            href="/signup"
            onClick={() => trackCta("nav_try_free", "/signup")}
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-9 px-4 text-[13px] sm:h-10 sm:px-5"
            )}
          >
            {t.nav.tryFree}
          </Link>
        </div>
      </div>
    </header>
  )
}

/* ────────────────────────────────────────────────────────── Hero */

function Hero({
  t,
  trackCta,
}: {
  t: Dictionary
  trackCta: (label: string, href: string) => void
}) {
  const ease = [0.22, 1, 0.36, 1] as const
  const lineDuration = 0.9
  const line2Delay = 0.6
  const titleEnd = line2Delay + lineDuration // ≈ 1.25s

  const blurLine = (delay: number) => ({
    initial: { opacity: 0, y: "15%", filter: "blur(14px)" },
    animate: { opacity: 1, y: "0%", filter: "blur(0px)" },
    transition: { duration: lineDuration, ease, delay },
  })

  return (
    <section className="px-5 pt-16 pb-10 sm:px-8 sm:pt-24 sm:pb-16 lg:pt-28">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center text-center">
        <h1
          className={cn(
            PILL_HEADING,
            "font-brand font-bold max-w-[900px] text-[32px] leading-[1.2] sm:text-[40px] md:text-[40px]"
          )}
        >
          <span className="block">
            <motion.span {...blurLine(0)} className="block">
              {t.hero.title1}
            </motion.span>
          </span>
          <span className="block">
            <motion.span {...blurLine(line2Delay)} className="block">
              {t.hero.title2} {t.hero.titleItalic}
            </motion.span>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: "15%" }}
          animate={{ opacity: 1, y: "0%" }}
          transition={{ duration: 0.7, ease, delay: line2Delay + 0.5 }}
          className="mt-5 max-w-xl text-[15px] leading-[1.5] text-muted-foreground sm:text-[16px]"
        >
          {t.hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: "15%" }}
          animate={{ opacity: 1, y: "0%" }}
          transition={{ duration: 0.7, ease, delay: line2Delay + 0.5 }}
          className="mt-7 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="#features"
            onClick={() => trackCta("hero_see_features", "#features")}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-10 px-5 text-sm"
            )}
          >
            {t.hero.seeFeatures}
          </Link>
          <Link
            href="/signup"
            onClick={() => trackCta("hero_get_started", "/signup")}
            className={cn(buttonVariants({ size: "lg" }), "h-10 px-5 text-sm")}
          >
            {t.hero.getStarted}
          </Link>
        </motion.div>

        {/* <motion.div
          initial={{ opacity: 0, y: "15%" }}
          animate={{ opacity: 1, y: "0%" }}
          transition={{ duration: 0.7, ease, delay: line2Delay + 0.7 }}
          className="mt-5 flex items-center gap-3"
        >
          <div className="flex -space-x-2.5">
            {TESTIMONIAL_META.slice(0, 5).map((m) => (
              <UserAvatar
                key={m.name}
                name={m.name}
                size={32}
                className="ring-2 ring-background"
              />
            ))}
          </div>
          <p className="text-[13px] text-muted-foreground sm:text-sm">
            Loved by{" "}
            <span className="font-semibold text-foreground">40,000+</span>{" "}
            learners
          </p>
        </motion.div> */}

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: titleEnd, ease, delay: 0 }}
          className="relative mt-14 w-full"
        >
          <InsetFrame>
            <div className="relative aspect-video w-full">
              <iframe
                src="https://www.youtube-nocookie.com/embed/ihp6ZjxbjCk?rel=0"
                title="nomi app walkthrough"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </InsetFrame>

          {/* <FloatingFeatureCards /> */}
        </motion.div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────── Floating feature cards */

const FLOATING_FEATURES = [
  {
    icon: Mic01Icon,
    title: "AI Lecture Notetaker",
    body: "Record any lecture and instantly get structured notes, flashcards, quizzes, and recall games.",
    bg: "bg-[#fde4d3]/75",
    border: "border-[#d99b6a]",
    iconBg: "bg-[#f7c9a8]",
    iconColor: "text-[#7a3f1a]",
    position:
      "left-[-3%] top-[20%] sm:left-[-5%] sm:top-[20%] lg:left-[-8%] lg:top-[15%]",
    delay: 0.2,
  },
  {
    icon: Brain01Icon,
    title: "AI Mind Maps from Any Source",
    body: "Auto-generate interactive mind maps from PDFs, lectures, and notes so every concept connects visually.",
    bg: "bg-[#dde7fb]/75",
    border: "border-[#6f8dd1]",
    iconBg: "bg-[#bccdf3]",
    iconColor: "text-[#1f3974]",
    position:
      "right-[-3%] top-[6%] sm:right-[-5%] sm:top-[4%] lg:right-[-9%] lg:top-[12%]",
    delay: 0.35,
  },
  {
    icon: Cards01Icon,
    title: "AI Flashcards from Any Source",
    body: "Generate, share, and study spaced-repetition flashcards from PDFs, videos, or notes - free forever.",
    bg: "bg-[#dcefdc]/75",
    border: "border-[#6fa872]",
    iconBg: "bg-[#bcdcbb]",
    iconColor: "text-[#274f29]",
    position:
      "left-[-4%] bottom-[12%] sm:left-[-6%] sm:bottom-[14%] lg:left-[-10%] lg:bottom-[18%]",
    delay: 0.5,
  },
  {
    icon: File01Icon,
    title: "AI PDF Summarizer",
    body: "Drop in long readings or slide decks and turn them into study guides and active-recall sets.",
    bg: "bg-[#fbe1ea]/75",
    border: "border-[#d97aa1]",
    iconBg: "bg-[#f4becf]",
    iconColor: "text-[#7a2244]",
    position:
      "right-[-3%] bottom-[18%] sm:right-[-5%] sm:bottom-[20%] lg:right-[-8%] lg:bottom-[24%]",
    delay: 0.65,
  },
  {
    icon: StickyNote02Icon,
    title: "Notes to Active Recall",
    body: "Turn messy lecture notes into organised study guides, flashcards, and quizzes in one click.",
    bg: "bg-[#fbf1cf]/75",
    border: "border-[#caa648]",
    iconBg: "bg-[#f3deaa]",
    iconColor: "text-[#6e4f12]",
    position:
      "left-[32%] bottom-[-4%] -translate-x-1/2 sm:bottom-[-6%] lg:bottom-[-4%]",
    delay: 0.8,
  },
  {
    icon: PodcastIcon,
    title: "AI Podcast from Your Notes",
    body: "Turn any notebook into a 25-minute host-and-guest podcast you can listen to on the go.",
    bg: "bg-[#ede0fb]/75",
    border: "border-[#9c7fd1]",
    iconBg: "bg-[#d6c2f0]",
    iconColor: "text-[#3e2670]",
    position:
      "left-[68%] bottom-[-4%] -translate-x-1/2 sm:bottom-[-6%] lg:bottom-[-4%]",
    delay: 0.95,
  },
] as const

function FloatingFeatureCards() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block">
      {FLOATING_FEATURES.map((f) => (
        <motion.div
          key={f.title}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1] as const,
            delay: 1.2 + f.delay,
          }}
          className={cn(
            "absolute flex items-center gap-3 rounded-2xl border p-3 pr-4 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12),0_4px_16px_-4px_rgba(0,0,0,0.0)] backdrop-blur-lg",
            f.bg,
            f.border,
            f.position
          )}
        >
          <div
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-full",
              f.iconBg,
              f.iconColor
            )}
          >
            <HugeiconsIcon icon={f.icon} strokeWidth={1.8} className="size-4" />
          </div>
          <h3 className="text-[13px] leading-tight font-semibold text-foreground">
            {f.title}
          </h3>
        </motion.div>
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────────────── Trust strip */

// TrustStrip is now imported from @/components/seo/trust-strip

/* ────────────────────────────────────────────────────────── Logo mark */

function LogoMark() {
  return (
    <div className="w-full max-w-[560px] overflow-hidden rounded-[14px] border border-[#e5e5e5] bg-white shadow-hairline">
      <div className="flex items-center gap-2 border-b border-[#ececec] bg-[#f7f7f7] px-3 py-1.5">
        <div className="size-2.5 rounded-full bg-[#e0e0e0]" />
        <div className="size-2.5 rounded-full bg-[#e0e0e0]" />
        <div className="size-2.5 rounded-full bg-[#e0e0e0]" />
        <div className="mx-auto flex h-6 w-[40%] items-center rounded-full border border-[#e8e8e8] bg-white px-3 text-[11px] text-[#b8b8b8]">
          nomistudy.com
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 py-28">
        <ArkiveLogo className="size-[44px] text-foreground sm:size-[56px]" />
        <span className="font-brand text-[30px] leading-none font-bold tracking-tight sm:text-[38px]">
          nomi
        </span>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────── Quizlet alternative */

function QuizletAlternative({ t }: { t: Dictionary }) {
  return (
    <section className="relative bg-muted px-5 py-20 sm:px-8 sm:py-28">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 block h-10 w-full text-background sm:hidden"
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
      >
        <path
          fill="currentColor"
          d="M0,24 Q60,0 120,24 T240,24 T360,24 T480,24 T600,24 T720,24 T840,24 T960,24 T1080,24 T1200,24 T1320,24 T1440,24 L1440,0 L0,0 Z"
        />
      </svg>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 hidden h-10 w-full text-background sm:block sm:h-12"
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
      >
        <path
          fill="currentColor"
          d="M0,24 Q30,0 60,24 T120,24 T180,24 T240,24 T300,24 T360,24 T420,24 T480,24 T540,24 T600,24 T660,24 T720,24 T780,24 T840,24 T900,24 T960,24 T1020,24 T1080,24 T1140,24 T1200,24 T1260,24 T1320,24 T1380,24 T1440,24 L1440,0 L0,0 Z"
        />
      </svg>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 block h-10 w-full -scale-y-100 text-background sm:hidden"
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
      >
        <path
          fill="currentColor"
          d="M0,24 Q60,0 120,24 T240,24 T360,24 T480,24 T600,24 T720,24 T840,24 T960,24 T1080,24 T1200,24 T1320,24 T1440,24 L1440,0 L0,0 Z"
        />
      </svg>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-10 w-full -scale-y-100 text-background sm:block sm:h-12"
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
      >
        <path
          fill="currentColor"
          d="M0,24 Q30,0 60,24 T120,24 T180,24 T240,24 T300,24 T360,24 T420,24 T480,24 T540,24 T600,24 T660,24 T720,24 T780,24 T840,24 T900,24 T960,24 T1020,24 T1080,24 T1140,24 T1200,24 T1260,24 T1320,24 T1380,24 T1440,24 L1440,0 L0,0 Z"
        />
      </svg>
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 md:grid-cols-2 md:gap-16">
        <motion.div {...fadeUp} className="order-2 md:order-none">
          <h2
            className={cn(
              PILL_HEADING,
              "text-center text-[28px] md:text-left md:text-[40px]"
            )}
          >
            {t.quizlet.title}
          </h2>
          <p className="mt-5 text-[15px] leading-[1.6] text-muted-foreground sm:text-[16px]">
            {t.quizlet.body}
          </p>
          <ul className="mt-6 space-y-3">
            {t.quizlet.bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-3 text-[15px] leading-[1.5] text-foreground sm:text-[16px]"
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  strokeWidth={2}
                  className="mt-0.5 size-5 shrink-0 text-foreground"
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          {...fadeUpStagger(1)}
          className="order-1 flex justify-center md:order-none"
        >
          <LogoMark />
        </motion.div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────── Study Tools grid */

const TOOL_PALETTES = [
  {
    bg: "bg-[#fde4d3]/55",
    border: "border-[#d99b6a]/45",
    iconBg: "bg-[#f7c9a8]",
    iconColor: "text-[#7a3f1a]",
  },
  {
    bg: "bg-[#dde7fb]/55",
    border: "border-[#6f8dd1]/45",
    iconBg: "bg-[#bccdf3]",
    iconColor: "text-[#1f3974]",
  },
  {
    bg: "bg-[#dcefdc]/55",
    border: "border-[#6fa872]/45",
    iconBg: "bg-[#bcdcbb]",
    iconColor: "text-[#274f29]",
  },
  {
    bg: "bg-[#fbe1ea]/55",
    border: "border-[#d97aa1]/45",
    iconBg: "bg-[#f4becf]",
    iconColor: "text-[#7a2244]",
  },
  {
    bg: "bg-[#fbf1cf]/55",
    border: "border-[#caa648]/45",
    iconBg: "bg-[#f3deaa]",
    iconColor: "text-[#6e4f12]",
  },
  {
    bg: "bg-[#ede0fb]/55",
    border: "border-[#9c7fd1]/45",
    iconBg: "bg-[#d6c2f0]",
    iconColor: "text-[#3e2670]",
  },
] as const

const STUDY_TOOLS = [
  { icon: Cards01Icon, name: "AI Flashcards", palette: 2 },
  { icon: File01Icon, name: "AI PDF Summarizer", palette: 3 },
  { icon: Presentation01Icon, name: "AI PPT Summarizer", palette: 5 },
  { icon: AiVideoIcon, name: "AI Video Summarizer", palette: 0 },
  { icon: Mic01Icon, name: "AI Lecture Note Taker", palette: 4 },
  { icon: AiWebBrowsingIcon, name: "AI Article Summarizer", palette: 1 },
  { icon: StickyNote02Icon, name: "AI Notes Summarizer", palette: 4 },
  { icon: HelpSquareIcon, name: "AI Quiz Generator", palette: 3 },
  { icon: Brain01Icon, name: "AI Mind Map Maker", palette: 1 },
  { icon: AiChat01Icon, name: "AI Tutor Chat", palette: 5 },
  { icon: PodcastIcon, name: "AI Podcast Maker", palette: 5 },
  { icon: Mortarboard02Icon, name: "AI Study Guide", palette: 2 },
] as const

// function StudyTools() {
//   return (
//     <section id="tools" className="px-5 py-20 sm:px-8 sm:py-24">
//       <div className="mx-auto max-w-[1200px]">
//         <motion.div {...fadeUp} className="text-center">
//           <p className="text-[12px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
//             Study tools
//           </p>
//           <h2
//             className={cn(
//               PILL_HEADING,
//               "mx-auto mt-4 max-w-[820px] text-[32px] sm:text-[40px] md:text-[40px]"
//             )}
//           >
//             Every AI study tool in one place.
//           </h2>
//           <p className="mx-auto mt-5 max-w-[620px] text-[15px] leading-[1.6] text-muted-foreground sm:text-[16px]">
//             One workspace for every way you study - flashcards, summaries,
//             quizzes, mind maps, and a tutor that knows your material.
//           </p>
//         </motion.div>

//         <motion.div
//           {...fadeUpStagger(1)}
//           className="mt-12 grid grid-cols-2 gap-3 sm:mt-14 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
//         >
//           {STUDY_TOOLS.map((tool) => {
//             const palette = TOOL_PALETTES[tool.palette]!
//             return (
//               <div
//                 key={tool.name}
//                 className={cn(
//                   "flex items-center gap-3 rounded-2xl border p-3.5 sm:p-4",
//                   palette.bg,
//                   palette.border
//                 )}
//               >
//                 <span
//                   className={cn(
//                     "inline-flex size-9 shrink-0 items-center justify-center rounded-full",
//                     palette.iconBg,
//                     palette.iconColor
//                   )}
//                 >
//                   <HugeiconsIcon
//                     icon={tool.icon}
//                     strokeWidth={1.8}
//                     className="size-4"
//                   />
//                 </span>
//                 <span className="text-[13px] leading-tight font-medium text-foreground sm:text-[14px]">
//                   {tool.name}
//                 </span>
//               </div>
//             )
//           })}
//         </motion.div>
//       </div>
//     </section>
//   )
// }

/* ────────────────────────────────────────────────────────── How It Works */

const ORBIT_INNER_ITEMS = [
  { angle: 0, icon: Pdf01Icon, bg: "bg-[#fde4d3]", color: "text-[#7a3f1a]" },
  { angle: 90, icon: Doc01Icon, bg: "bg-[#dde7fb]", color: "text-[#1f3974]" },
  { angle: 180, icon: Ppt01Icon, bg: "bg-[#dcefdc]", color: "text-[#274f29]" },
  { angle: 270, icon: Txt01Icon, bg: "bg-[#fbe1ea]", color: "text-[#7a2244]" },
] as const

const ORBIT_OUTER_ITEMS = [
  { angle: 0, icon: Image01Icon, bg: "bg-[#fbf1cf]", color: "text-[#6e4f12]" },
  {
    angle: 120,
    icon: Video01Icon,
    bg: "bg-[#ede0fb]",
    color: "text-[#3e2670]",
  },
  { angle: 240, icon: Link01Icon, bg: "bg-[#dde7fb]", color: "text-[#1f3974]" },
] as const

function UploadOrbitIllustration() {
  const outerR = 112
  const innerR = 70

  const toRad = (deg: number) => (deg * Math.PI) / 180

  return (
    <div className="relative mx-auto size-56 sm:size-64">
      <div className="absolute inset-3 rounded-full border border-dashed border-muted-foreground/25" />
      <div className="absolute inset-[52px] rounded-full border border-dashed border-muted-foreground/25" />

      <motion.div
        className="absolute inset-0"
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 36, ease: "linear" }}
      >
        {ORBIT_OUTER_ITEMS.map(({ angle, icon, bg, color }) => {
          const x = Math.round(Math.sin(toRad(angle)) * outerR)
          const y = -Math.round(Math.cos(toRad(angle)) * outerR)
          return (
            <motion.span
              key={angle}
              className={cn(
                "absolute flex size-9 items-center justify-center rounded-full",
                bg,
                color
              )}
              style={{
                top: `calc(50% + ${y}px)`,
                left: `calc(50% + ${x}px)`,
                marginLeft: -18,
                marginTop: -18,
              }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 36, ease: "linear" }}
            >
              <HugeiconsIcon icon={icon} strokeWidth={1.5} className="size-4" />
            </motion.span>
          )
        })}
      </motion.div>

      <motion.div
        className="absolute inset-[42px]"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
      >
        {ORBIT_INNER_ITEMS.map(({ angle, icon, bg, color }) => {
          const x = Math.round(Math.sin(toRad(angle)) * innerR)
          const y = -Math.round(Math.cos(toRad(angle)) * innerR)
          return (
            <motion.span
              key={angle}
              className={cn(
                "absolute flex size-9 items-center justify-center rounded-full",
                bg,
                color
              )}
              style={{
                top: `calc(50% + ${y}px)`,
                left: `calc(50% + ${x}px)`,
                marginLeft: -18,
                marginTop: -18,
              }}
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
            >
              <HugeiconsIcon icon={icon} strokeWidth={1.5} className="size-4" />
            </motion.span>
          )
        })}
      </motion.div>

      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-foreground text-background shadow-[0_0_0_6px_var(--color-background)]">
          <HugeiconsIcon
            icon={Upload03Icon}
            strokeWidth={1.6}
            className="size-5"
          />
        </div>
      </div>
    </div>
  )
}

const GENERATOR_ITEMS = [
  {
    label: "Quiz",
    icon: HelpSquareIcon,
    bg: "bg-[#fdf4ed]/70",
    iconBg: "bg-[#fce4d3]",
    iconColor: "text-[#9e5a37]",
  },
  {
    label: "Flashcard",
    icon: Cards01Icon,
    bg: "bg-[#f2faf2]/70",
    iconBg: "bg-[#d8f0d8]",
    iconColor: "text-[#3d7240]",
  },
  {
    label: "Podcast",
    icon: PodcastIcon,
    bg: "bg-[#f6f2fc]/70",
    iconBg: "bg-[#e3d4f7]",
    iconColor: "text-[#5a3e85]",
  },
  {
    label: "Summary",
    icon: File01Icon,
    bg: "bg-[#fdfaef]/70",
    iconBg: "bg-[#f5e8b8]",
    iconColor: "text-[#8b7130]",
  },
] as const

function GeneratingIllustration({
  showProgress = true,
}: {
  showProgress?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  const [progress, setProgress] = useState(0)
  const [cycle, setCycle] = useState(0)

  const DURATION = 2500
  const PAUSE = 2500

  useEffect(() => {
    if (!inView) return

    let raf: number
    const cycleStart = Date.now()

    const tick = () => {
      const elapsed = Date.now() - cycleStart
      const total = DURATION + PAUSE
      if (elapsed >= total) {
        setCycle((c) => c + 1)
        setProgress(0)
        return
      }
      if (elapsed < DURATION) {
        setProgress(Math.round((elapsed / DURATION) * 100))
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, cycle])

  const itemDelay = (i: number) =>
    (i / (GENERATOR_ITEMS.length - 1)) * (DURATION / 1000)

  return (
    <div ref={ref} className="w-full">
      {showProgress && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-foreground">
              Generating...
            </span>
            <span className="font-mono text-[13px] font-medium text-muted-foreground tabular-nums">
              {progress}%
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              key={cycle}
              className="h-full rounded-full bg-sky-500"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>
        </>
      )}

      <div
        className={cn("flex flex-col gap-2.5", showProgress ? "mt-6" : "mt-2")}
      >
        {GENERATOR_ITEMS.map((item, i) => (
          <motion.div
            key={`${item.label}-${cycle}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: itemDelay(i),
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5",
              item.bg
            )}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full",
                item.iconBg,
                item.iconColor
              )}
            >
              <HugeiconsIcon
                icon={item.icon}
                strokeWidth={1.6}
                className="size-3.5"
              />
            </span>
            <span className="text-[13px] leading-tight font-medium text-foreground">
              {item.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const ANALYSIS_STEPS = [
  {
    label: "Analyzing concepts and relationships",
    iconBg: "bg-[#d8f0d8]",
    iconColor: "text-[#5fa862]",
    stroke: "#5fa862",
  },
  {
    label: "Detecting important topics and themes",
    iconBg: "bg-[#d8f0d8]",
    iconColor: "text-[#5fa862]",
    stroke: "#5fa862",
  },
  {
    label: "Organizing knowledge into clear structures",
    iconBg: "bg-[#d8f0d8]",
    iconColor: "text-[#5fa862]",
    stroke: "#5fa862",
  },
]

function AnalyzingIllustration() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  const [progress, setProgress] = useState(0)
  const [cycle, setCycle] = useState(0)

  const DURATION = 2500
  const PAUSE = 2500

  useEffect(() => {
    if (!inView) return

    let raf: number
    const cycleStart = Date.now()

    const tick = () => {
      const elapsed = Date.now() - cycleStart
      const total = DURATION + PAUSE
      if (elapsed >= total) {
        setCycle((c) => c + 1)
        setProgress(0)
        return
      }
      if (elapsed < DURATION) {
        setProgress(Math.round((elapsed / DURATION) * 100))
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, cycle])

  const stepIndex = Math.min(
    Math.floor((progress / 100) * ANALYSIS_STEPS.length),
    ANALYSIS_STEPS.length - 1
  )

  return (
    <div ref={ref} className="w-full">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#fef2f2]">
          <HugeiconsIcon
            icon={Video01Icon}
            strokeWidth={1.6}
            className="size-5 text-[#c0392b]"
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] leading-tight font-medium text-foreground">
            Black Holes Explained
          </p>
          <p className="truncate text-[12px] leading-tight text-muted-foreground">
            YouTube · 12 min
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-[13px] font-medium text-foreground">
          Analyzing...
        </span>
        <span className="font-mono text-[13px] font-medium text-muted-foreground tabular-nums">
          {progress}%
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          key={cycle}
          className="h-full rounded-full bg-sky-500"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "easeOut" }}
        />
      </div>

      <div className="mt-3 space-y-1">
        {ANALYSIS_STEPS.map((step, i) => {
          const isActive = i <= stepIndex
          return (
            <motion.div
              key={`${step.label}-${cycle}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className="flex items-center gap-2.5 rounded-xl px-3 py-1"
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                  isActive ? step.iconBg : "bg-muted"
                )}
              >
                <svg
                  width="10"
                  height="8"
                  viewBox="0 0 10 8"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M1 4l2.5 2.5L9 1"
                    stroke={isActive ? step.stroke : "#a59f97"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-colors duration-300"
                  />
                </svg>
              </span>
              <span
                className={cn(
                  "text-[13px] leading-tight transition-colors duration-300",
                  isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-[1200px]">
        <motion.div {...fadeUp} className="text-center">
          <p className="text-[12px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            How it works
          </p>
          <h2
            className={cn(
              PILL_HEADING,
              "mx-auto mt-4 max-w-[720px] text-[32px] sm:text-[40px] md:text-[40px]"
            )}
          >
            Study Smarter in 3 Simple Steps
          </h2>
          <p className="mx-auto mt-2 max-w-[600px] text-[15px] leading-[1.6] text-muted-foreground sm:text-[16px]">
            Upload your materials and instantly get personalized AI study tools.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:mt-14 sm:gap-6 md:grid-cols-3">
          <motion.div
            {...fadeUpStagger(0)}
            className="flex flex-col rounded-2xl border border-border bg-white px-5 py-6 sm:px-6 sm:py-8"
          >
            <span className="text-[28px] leading-none font-extrabold tracking-[-0.03em] text-foreground">
              1
            </span>
            <h3 className="mt-3 text-[18px] leading-[1.3] font-medium text-foreground">
              Upload Anything You Want To Study
            </h3>
            <p className="mt-2 max-w-xs text-[14px] leading-[1.6] text-muted-foreground">
              Upload your lecture slides, PDFs, notes, textbooks, research
              papers, videos, or recordings.
            </p>
            <div className="mt-auto pt-8">
              <UploadOrbitIllustration />
            </div>
          </motion.div>

          <motion.div
            {...fadeUpStagger(1)}
            className="flex flex-col rounded-2xl border border-border bg-white px-5 py-6 sm:px-6 sm:py-8"
          >
            <span className="text-[28px] leading-none font-extrabold tracking-[-0.03em] text-foreground">
              2
            </span>
            <h3 className="mt-3 text-[18px] leading-[1.3] font-medium text-foreground">
              Nomi Understands Everything For You
            </h3>
            <p className="mt-2 max-w-xs text-[14px] leading-[1.6] text-muted-foreground">
              Nomi analyzes your content, identifies key concepts, and extracts
              everything you need to study effectively.
            </p>
            <div className="mt-auto pt-4">
              <AnalyzingIllustration />
            </div>
          </motion.div>

          <motion.div
            {...fadeUpStagger(2)}
            className="flex flex-col rounded-2xl border border-border bg-white px-5 py-6 sm:px-6 sm:py-8"
          >
            <span className="text-[28px] leading-none font-extrabold tracking-[-0.03em] text-foreground">
              3
            </span>
            <h3 className="mt-3 text-[18px] leading-[1.3] font-medium text-foreground">
              Practice & Ace Your Next Exam
            </h3>
            <p className="mt-2 max-w-xs text-[14px] leading-[1.6] text-muted-foreground">
              Study with flashcards, quizzes, summaries, podcasts, and an AI
              tutor tailored to your course material.
            </p>
            <div className="mt-auto pt-4">
              <GeneratingIllustration showProgress={false} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────── Flashcard Generator illustration */

const MINI_FLASHCARD = {
  q: "What is the powerhouse of the cell?",
  a: "Mitochondria - the organelle that produces ATP through cellular respiration.",
}

function FlashcardGeneratorIllustration({ flipped }: { flipped: boolean }) {
  return (
    <div className="relative flex h-full w-full items-start justify-center overflow-hidden px-5 pt-12">
      {/* Subtle grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.022) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Stacked cards behind */}
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-12">
        <div className="relative h-[148px] w-full max-w-[240px] sm:h-[155px] sm:max-w-[255px]">
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-2xl border border-[#e5e5e5] bg-white shadow-sm"
            style={{ transform: "translateY(-28%) scale(0.6)" }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-2xl border border-[#e5e5e5] bg-white shadow-sm"
            style={{ transform: "translateY(-14%) scale(0.8)" }}
          />
        </div>
      </div>

      {/* Main flashcard */}
      <div className="relative z-10 h-[148px] w-full max-w-[240px] sm:h-[155px] sm:max-w-[255px]">
        <div className="relative h-full w-full cursor-pointer overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white p-6 text-center shadow-[0_0_0_0.5px_rgba(0,0,0,0.03),0_10px_28px_rgba(0,0,0,0.06)]">
          {/* Question text */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center p-6"
            animate={{
              y: flipped ? "-10%" : "0%",
              filter: flipped ? "blur(8px)" : "blur(0px)",
              opacity: flipped ? 0 : 1,
            }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-[9px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Question
            </span>
            <p className="mt-2 text-[12px] leading-snug font-medium text-foreground sm:text-[13px]">
              {MINI_FLASHCARD.q}
            </p>
          </motion.div>

          {/* Answer text */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center p-6"
            animate={{
              y: flipped ? "0%" : "10%",
              filter: flipped ? "blur(0px)" : "blur(8px)",
              opacity: flipped ? 1 : 0,
            }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-[9px] font-semibold tracking-[0.18em] text-foreground/40 uppercase">
              Answer
            </span>
            <p className="mt-2 text-[11px] leading-snug font-medium text-foreground sm:text-[12px]">
              {MINI_FLASHCARD.a}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────── Quiz Generator illustration */

const MINI_QUIZ = {
  q: "Which process converts light energy into chemical energy?",
  options: ["Cellular respiration", "Photosynthesis", "Fermentation"],
  answer: 1,
}

function QuizGeneratorIllustration({ hovered }: { hovered: boolean }) {
  const selected = hovered ? MINI_QUIZ.answer : -1

  return (
    <div className="relative h-full w-full overflow-hidden pl-28">
      {/* Subtle grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.022) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Quiz card - anchored top-right with space on the left and bottom */}
      <div className="absolute top-0 right-0 bottom-[100px] left-28 z-10 rounded-tl-none rounded-bl-2xl border border-[#e5e5e5] bg-white p-5 shadow-[0_0_0_0.5px_rgba(0,0,0,0.03),0_10px_28px_rgba(0,0,0,0.06)] lg:bottom-[115px]">
        <span className="text-[9px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Question
        </span>
        <p className="mt-2 text-[12px] leading-snug font-medium text-foreground sm:text-[13px]">
          {MINI_QUIZ.q}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {MINI_QUIZ.options.map((opt, i) => {
            const isSelected = i === selected
            return (
              <motion.div
                key={opt}
                animate={{
                  backgroundColor: isSelected
                    ? "#e8f5ec"
                    : "rgba(232,245,236,0)",
                  borderColor: isSelected ? "#bfe0c9" : "#e5e5e5",
                }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-2.5 rounded-lg border px-3 py-2"
              >
                <div
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] leading-tight font-semibold transition-colors duration-200",
                    isSelected
                      ? "bg-[#5fae74] text-white"
                      : "bg-[#f2f2f2] text-muted-foreground"
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </div>
                <span
                  className={cn(
                    "text-[11px] leading-snug sm:text-[12px]",
                    isSelected
                      ? "font-medium text-[#2f7d4f]"
                      : "text-foreground"
                  )}
                >
                  {opt}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────── Features (zigzag) */

function FeaturesZigzag({ t }: { t: Dictionary }) {
  const items = t.features.items
  const isLg = useIsLg()

  return (
    <section id="features" className="px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-[1200px]">
        <motion.h2
          {...fadeUp}
          className={cn(
            PILL_HEADING,
            "mx-auto max-w-[800px] text-center text-[32px] sm:text-[40px] md:text-[40px]"
          )}
        >
          {t.features.heading}
        </motion.h2>

        <div className="mt-16 flex flex-col gap-4 sm:mt-20 sm:gap-5">
          {/* First row - flashcard left, tutor fills to right edge */}
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-5">
            <FeatureCard
              index={0}
              title={items[0]!.title}
              description={items[0]!.body}
              className="h-[350px] w-full lg:w-[390px] lg:shrink-0"
              mediaClassName="aspect-auto sm:aspect-auto h-full"
            >
              {(hovered: boolean) => (
                <FlashcardGeneratorIllustration flipped={hovered} />
              )}
            </FeatureCard>

            <FeatureCard
              index={1}
              title={items[1]!.title}
              description={items[1]!.body}
              className="h-[350px] w-full lg:flex-1"
              mediaClassName="aspect-auto sm:aspect-auto h-full"
            >
              {(hovered: boolean) => <AiChat active={hovered} />}
            </FeatureCard>
          </div>

          {/* Second row - quiz (flex-1) + podcast (390px) */}
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-5">
            <FeatureCard
              index={2}
              title={items[2]!.title}
              description={items[2]!.body}
              className="h-[350px] w-full lg:w-[675px] lg:shrink-0"
              mediaClassName="aspect-auto h-full"
            >
              {(hovered: boolean) => (
                <QuizGeneratorIllustration hovered={hovered} />
              )}
            </FeatureCard>

            <FeatureCard
              index={3}
              title={items[3]!.title}
              description={items[3]!.body}
              className="h-[350px] w-full lg:flex-1"
              mediaClassName="aspect-auto h-full"
            >
              {(hovered: boolean) => <PodcastWave active={hovered} />}
            </FeatureCard>
          </div>

          {/* Third row - mind maps (flex-1) + audio note taker (390px) */}
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-5">
            <FeatureCard
              index={4}
              title={items[4]!.title}
              description={items[4]!.body}
              className="h-[350px] w-full lg:flex-1"
              mediaClassName="aspect-auto h-full"
            >
              {(hovered: boolean) => (
                <MindmapPreview active={hovered} compact={!isLg} />
              )}
            </FeatureCard>

            <FeatureCard
              index={5}
              title={items[5]!.title}
              description={items[5]!.body}
              className="h-[350px] w-full lg:w-[390px] lg:shrink-0"
              mediaClassName="aspect-auto h-full"
            >
              {(hovered: boolean) => <AudioRecorder active={hovered} />}
            </FeatureCard>
          </div>

          {/* Fourth row - tutor personas, languages, and dummy card
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
            <FeatureCard
              index={6}
              title={items[6]!.title}
              description={items[6]!.body}
              className="h-[350px]"
              mediaClassName="aspect-auto h-full"
            >
              <Image
                src={FEATURE_IMAGES[6] ?? "/images/hero-screenshot.webp"}
                alt={items[6]!.title}
                width={2400}
                height={1500}
                className="h-full w-full object-cover"
              />
            </FeatureCard>

            <FeatureCard
              index={7}
              title={items[7]!.title}
              description={items[7]!.body}
              className="h-[350px]"
              mediaClassName="aspect-auto h-full"
            >
              {(hovered: boolean) => <HelloBurst active={hovered} />}
            </FeatureCard>

            <FeatureCard
              index={8}
              title={items[8]!.title}
              description={items[8]!.body}
              className="h-[350px]"
              mediaClassName="aspect-auto h-full"
            >
              <Image
                src={FEATURE_IMAGES[8] ?? "/images/hero-screenshot.webp"}
                alt={items[8]!.title}
                width={2400}
                height={1500}
                className="h-full w-full object-cover"
              />
            </FeatureCard>
          </div>
          */}
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────── Mid-page CTA */

function MidCta({
  t,
  trackCta,
}: {
  t: Dictionary
  trackCta: (label: string, href: string) => void
}) {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20">
      <motion.div
        {...fadeUp}
        className="mx-auto flex max-w-[720px] flex-col items-center rounded-[20px] border border-border bg-[#f8f8f9] px-6 py-10 text-center sm:px-10 sm:py-12"
      >
        <h2
          className={cn(
            PILL_HEADING,
            "text-[24px] sm:text-[32px] md:text-[36px]"
          )}
        >
          Ready to study smarter?
        </h2>
        <p className="mt-3 max-w-md text-[15px] leading-[1.6] text-muted-foreground sm:text-[16px]">
          Join thousands of students turning their notes into flashcards,
          quizzes, and summaries - all in seconds.
        </p>
        <Link
          href="/signup"
          onClick={() => trackCta("mid_cta", "/signup")}
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-7 h-11 rounded-pill px-7 text-sm"
          )}
        >
          {t.hero.getStarted}
        </Link>
      </motion.div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────── Testimonials */

// Testimonials is now imported from @/components/seo/testimonials

/* ────────────────────────────────────────────────────────── Pricing */

function Pricing({ t }: { t: Dictionary }) {
  return (
    <section id="pricing" className="px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-[1200px]">
        <motion.div {...fadeUp} className="text-center">
          <p className="text-[12px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {t.pricing.eyebrow}
          </p>
          <h2
            className={cn(
              PILL_HEADING,
              "mx-auto mt-4 max-w-[820px] text-[32px] sm:text-[40px] md:text-[40px]"
            )}
          >
            {t.pricing.heading}
          </h2>
          <p className="mx-auto mt-5 max-w-[620px] text-[15px] leading-[1.6] text-muted-foreground sm:text-[16px]">
            {t.pricing.subhead}
          </p>
        </motion.div>

        <motion.div {...fadeUpStagger(1)} className="mt-10">
          <PricingPanel
            ctaLabel={t.pricing.cta}
            href="/signup"
            footnote={t.pricing.footnote}
          />
        </motion.div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────── FAQ */

function Faq({ t }: { t: Dictionary }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  }
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-[820px]">
        <motion.h2
          {...fadeUp}
          className={cn(
            PILL_HEADING,
            "text-center text-[32px] sm:text-[40px] md:text-[40px]"
          )}
        >
          {t.faq.heading}
        </motion.h2>
        <motion.p
          {...fadeUpStagger(1)}
          className="mx-auto mt-4 max-w-[600px] text-center text-[15px] leading-[1.6] text-muted-foreground sm:text-[16px]"
        >
          {t.faq.intro}
        </motion.p>

        <motion.div {...fadeUpStagger(2)} className="mt-12 sm:mt-16">
          <div className="divide-y divide-border rounded-[16px] bg-[#f8f8f9] px-6 sm:px-8">
            {t.faq.items.map((item) => (
              <details
                key={item.q}
                className="group py-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[16px] font-medium text-foreground sm:text-[17px]">
                  <span>{item.q}</span>
                  <span
                    aria-hidden
                    className="mt-1 inline-flex size-5 shrink-0 items-center justify-center text-foreground transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-10 text-[15px] leading-[1.6] text-muted-foreground">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────── Final CTA */

function FinalCta({
  t,
  trackCta,
}: {
  t: Dictionary
  trackCta: (label: string, href: string) => void
}) {
  return (
    <section className="px-5 pb-20 sm:px-8 sm:pb-24">
      <div className="mx-auto max-w-[1200px]">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-[24px] px-6 py-12 sm:px-10 sm:py-16 md:py-20"
        >
          <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:gap-12">
            <div className="flex justify-center md:justify-start">
              <Image
                src="/images/nomi-cd-students.webp"
                alt="nomi students"
                width={1040}
                height={693}
                unoptimized
                className="h-auto w-full max-w-[360px] rounded-[12px] sm:max-w-[440px] md:max-w-[520px]"
              />
            </div>

            <div className="text-center md:text-left">
              <ArkiveLogo className="mx-auto hidden size-9 text-foreground md:mx-0 md:block" />
              <h2
                className={cn(
                  PILL_HEADING,
                  "mx-auto mt-6 max-w-2xl text-[32px] sm:text-[40px] md:mx-0 md:text-[40px]"
                )}
              >
                {(() => {
                  const parts = t.cta.heading.split(/(2×\s+\S+)/)
                  return parts.map((part, i) => {
                    const match = part.match(/^2×\s+(\S+)$/)
                    if (match) {
                      return (
                        <span key={i}>
                          up to{" "}
                          <span className="relative inline-block font-serif tracking-[0.02em] italic">
                            4x {match[1]}
                            <Image
                              src="/images/brush-stroke.png"
                              alt=""
                              width={480}
                              height={320}
                              unoptimized
                              className="pointer-events-none absolute top-full left-1/2 w-[130%] -translate-x-1/2 -translate-y-[55%] select-none"
                            />
                          </span>
                        </span>
                      )
                    }
                    return <span key={i}>{part}</span>
                  })
                })()}
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-[1.6] text-muted-foreground sm:text-[16px] md:mx-0">
                {t.cta.body}
              </p>
              <div className="mt-9">
                <Link
                  href="/signup"
                  onClick={() => trackCta("final_cta", "/signup")}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-11 rounded-pill px-6 text-sm"
                  )}
                >
                  {t.cta.button}
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────── Launched On */

function LaunchedOn() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <p className="text-center text-[14px] leading-[1.43] text-gravel">
          As Seen On
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          <a
            href="https://huzzler.so/products/lX1FkPchtR/nomi-ai-tutor-and-study-tools-1?utm_source=huzzler_product_website&utm_medium=badge&utm_campaign=free_listing"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              alt="Huzzler Embed Badge"
              src="/images/huzzler-featured.png"
              width={140}
              height={48}
              unoptimized
            />
          </a>
          <a
            href="https://findly.tools/nomi-ai-tutor-for-students-and-learners?utm_source=nomi-ai-tutor-for-students-and-learners"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://findly.tools/badges/findly-tools-badge-light.svg"
              alt="Featured on Findly.tools"
              width={140}
              height={44}
            />
          </a>
        </div>
      </div>
    </section>
  )
}

/* Footer */

// SiteFooter is now imported from @/components/seo/site-footer

const DISCORD_INVITE_URL =
  process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ?? "https://discord.gg/nomi"

// Map localized footer item labels to their real routes. Items we don't
// have pages for yet render as plain (unlinked) text.
const HIDDEN_FOOTER_ITEMS = new Set<string>([])

const FOOTER_HREF_MAP: Record<string, string> = {
  Pricing: "/#pricing",
  Prezzi: "/#pricing",
  Preise: "/#pricing",
  Precios: "/#pricing",
  Fiyatlandırma: "/#pricing",
  Blog: "/blog",
  Privacy: "/privacy",
  Datenschutz: "/privacy",
  Privacidad: "/privacy",
  Gizlilik: "/privacy",
  Terms: "/terms",
  Termini: "/terms",
  AGB: "/terms",
  Términos: "/terms",
  Şartlar: "/terms",
  Contact: "/contact",
  Contatti: "/contact",
  Kontakt: "/contact",
  Contacto: "/contact",
  İletişim: "/contact",
  Community: DISCORD_INVITE_URL,
  Comunidad: DISCORD_INVITE_URL,
  Topluluk: DISCORD_INVITE_URL,
}

function footerHref(label: string): string | null {
  return FOOTER_HREF_MAP[label] ?? null
}

function isExternalHref(href: string): boolean {
  return href.startsWith("http") || href.startsWith("mailto:")
}
