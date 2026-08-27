"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import { Upload03Icon, Cancel01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { ArkiveLogo } from "@/components/app-sidebar"
import { TrustStrip } from "@/components/seo/trust-strip"
import { Testimonials } from "@/components/seo/testimonials"
import { AuthModal } from "@/components/seo/auth-modal"
import { SiteFooter } from "@/components/seo/site-footer"
import {
  type SeoToolType,
  TOOL_TABS,
  PAGE_META,
  FEATURE_CARDS,
  FAQ_ITEMS,
  PEOPLE_ALSO_ASK,
} from "@/app/ai-seo-data"

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

export function SeoPage({ type }: { type: SeoToolType }) {
  const meta = PAGE_META[type]
  const featureCards = FEATURE_CARDS[type]
  const faqItems = FAQ_ITEMS[type]
  const peopleAlsoAsk = PEOPLE_ALSO_ASK[type]

  const [url, setUrl] = useState("")
  const [authOpen, setAuthOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileConfirmed, setFileConfirmed] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleGenerate = useCallback(() => {
    setAuthOpen(true)
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0]
      if (selected) {
        setFile(selected)
        setFileConfirmed(false)
      }
    },
    []
  )

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) {
      setFile(dropped)
      setFileConfirmed(false)
    }
  }, [])

  const handleCancelFile = useCallback(() => {
    setFile(null)
    setFileConfirmed(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  const handleConfirmFile = useCallback(() => {
    setFileConfirmed(true)
    setAuthOpen(true)
  }, [])

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [...faqItems, ...peopleAlsoAsk].map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />

      {/* Nav */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2">
            <ArkiveLogo className="size-[28px] text-foreground" />
            <span className="font-brand text-[20px] leading-none font-bold tracking-tight">
              nomi
            </span>
          </Link>
          <Link href="/signup">
            <Button size="sm">Try for free</Button>
          </Link>
        </div>
      </header>

      {/* Tab selector */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="flex gap-1 overflow-x-auto py-3">
            {TOOL_TABS.map((tab) => {
              const isActive = tab.type === type
              return (
                <Link
                  key={tab.type}
                  href={tab.href}
                  className={cn(
                    "shrink-0 rounded-pill px-5 py-2 text-[14px] font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                  aria-current={isActive ? "page" : undefined}
                  onClick={(e) => {
                    if (isActive) e.preventDefault()
                  }}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="px-5 pt-16 pb-12 sm:px-8 sm:pt-20 sm:pb-16">
        <div className="mx-auto max-w-[720px] text-center">
          <motion.h1
            {...fadeUp}
            className={cn(
              PILL_HEADING,
              "text-[32px] sm:text-[40px] md:text-[44px]"
            )}
          >
            {meta.title}
          </motion.h1>
          <motion.p
            {...fadeUpStagger(1)}
            className="mt-4 text-[15px] leading-[1.6] text-muted-foreground sm:text-[16px]"
          >
            {meta.subtitle}
          </motion.p>

          {/* URL input + Generate */}
          <motion.div
            {...fadeUpStagger(2)}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={meta.inputPlaceholder}
              className="h-11 flex-1 rounded-pill border border-border bg-background px-5 text-[15px] text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-foreground"
            />
            <Button
              size="lg"
              className="h-11 shrink-0 px-6 text-[14px]"
              onClick={handleGenerate}
            >
              Generate
            </Button>
          </motion.div>

          {/* OR divider */}
          <motion.div
            {...fadeUpStagger(3)}
            className="my-6 flex items-center gap-3 text-[12px] text-muted-foreground"
          >
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </motion.div>

          {/* File upload */}
          <motion.div {...fadeUpStagger(4)}>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt,.pptx,.mp4,.mp3,.wav"
            />
            {!file ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-3 rounded-[16px] border-2 border-dashed px-6 py-10 text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground sm:py-14",
                  dragging
                    ? "border-foreground/60 bg-secondary text-foreground"
                    : "border-border"
                )}
              >
                <HugeiconsIcon icon={Upload03Icon} className="size-8" />
                <span className="text-[15px] font-medium">
                  Upload a file
                </span>
                <span className="text-[13px] text-muted-foreground/70">
                  PDF, DOC, TXT, PPTX, MP4, MP3
                </span>
              </button>
            ) : (
              <div className="rounded-[16px] border border-border bg-secondary p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-background">
                    <HugeiconsIcon icon={Upload03Icon} className="size-5 text-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-foreground">
                      {file.name}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelFile}
                    className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                  >
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      className="size-4"
                      strokeWidth={2}
                    />
                  </button>
                </div>
                {!fileConfirmed && (
                  <div className="mt-4 flex flex-col gap-2">
                    <p className="text-[13px] text-muted-foreground">
                      Please confirm this is the file you want to upload
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={handleCancelFile}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={handleConfirmFile}
                      >
                        Confirm
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Trust strip */}
      <TrustStrip />

      {/* Feature cards */}
      <section className="px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1200px]">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <p
              className={cn(
                PILL_HEADING,
                "text-[28px] sm:text-[36px] md:text-[40px]"
              )}
            >
              Everything you need in one place
            </p>
          </motion.div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((card, i) => (
              <motion.div
                key={card.title}
                {...fadeUpStagger(i)}
                className="flex flex-col rounded-[16px] border border-border bg-background p-6"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-secondary">
                  <span className="text-[18px] font-semibold text-foreground">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-[18px] font-medium leading-[1.35] text-foreground">
                  {card.title}
                </h3>
                <p className="mt-2 text-[14px] leading-[1.5] text-muted-foreground sm:text-[15px]">
                  {card.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* FAQ */}
      <section className="px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[820px]">
          <motion.h2
            {...fadeUp}
            className={cn(
              PILL_HEADING,
              "text-center text-[32px] sm:text-[40px] md:text-[40px]"
            )}
          >
            Frequently asked questions
          </motion.h2>
          <motion.p
            {...fadeUpStagger(1)}
            className="mx-auto mt-4 max-w-[600px] text-center text-[15px] leading-[1.6] text-muted-foreground sm:text-[16px]"
          >
            Everything you need to know about nomi&apos;s {meta.title.toLowerCase()}.
          </motion.p>

          <motion.div {...fadeUpStagger(2)} className="mt-12 sm:mt-16">
            <div className="divide-y divide-border rounded-[16px] bg-[#f8f8f9] px-6 sm:px-8">
              {faqItems.map((item) => (
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

      {/* People Also Ask */}
      <section className="px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-[820px]">
          <motion.h2
            {...fadeUp}
            className={cn(
              PILL_HEADING,
              "text-center text-[28px] sm:text-[36px] md:text-[40px]"
            )}
          >
            People also ask
          </motion.h2>

          <motion.div {...fadeUpStagger(1)} className="mt-12 divide-y divide-border">
            {peopleAlsoAsk.map((item) => (
              <div key={item.q} className="py-5">
                <p className="text-[16px] font-medium text-foreground sm:text-[17px]">
                  {item.q}
                </p>
                <p className="mt-2 text-[15px] leading-[1.6] text-muted-foreground">
                  {item.a}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </>
  )
}
