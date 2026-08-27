"use client"

import Link from "next/link"

import { ArkiveLogo } from "@/components/app-sidebar"

const DISCORD_INVITE_URL =
  process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ?? "https://discord.gg/nomi"

const STUDY_TOOLS: FooterColumn = {
  title: "Study Tools",
  items: [
    { label: "AI Flashcards", href: "/ai-flashcards" },
    { label: "AI PDF Summarizer", href: "/ai-pdf-summarizer" },
    { label: "AI Video Summarizer", href: "/ai-video-summarizer" },
    { label: "AI Podcast Generator", href: "/ai-podcast-generator" },
    { label: "AI Quiz Maker", href: "/ai-quiz-maker" },
  ],
}

const DEFAULT_COLUMNS: FooterColumn[] = [
  {
    title: "Resources",
    items: [
      { label: "Pricing", href: "/#pricing" },
      { label: "Blog", href: "/blog" },
      { label: "Community", href: DISCORD_INVITE_URL },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Contact", href: "/contact" },
    ],
  },
]

type FooterColumn = {
  title: string
  items: { label: string; href: string | null }[]
}

function SocialLink({
  href,
  icon,
  "aria-label": ariaLabel,
}: {
  href: string
  icon: React.ReactNode
  "aria-label": string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={ariaLabel}
      className="flex size-12 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted"
    >
      {icon}
    </a>
  )
}

function ColumnList({ column }: { column: FooterColumn }) {
  return (
    <div>
      <p className="font-display text-[12px] font-bold tracking-[0.04em] text-foreground uppercase">
        {column.title}
      </p>
      <ul className="mt-4 space-y-2.5">
        {column.items.map((item) => {
          if (!item.href) {
            return (
              <li key={item.label}>
                <span className="text-[13px] text-muted-foreground">
                  {item.label}
                </span>
              </li>
            )
          }
          const isExternal =
            item.href.startsWith("http") || item.href.startsWith("mailto:")
          if (isExternal) {
            return (
              <li key={item.label}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                </a>
              </li>
            )
          }
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className="text-[13px] text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function SiteFooter({
  tagline,
  extraColumns,
  copyright,
  madeIn,
}: {
  tagline?: string
  extraColumns?: FooterColumn[]
  copyright?: string
  madeIn?: string
}) {
  const columns = extraColumns ?? DEFAULT_COLUMNS

  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-10 md:grid-cols-[1.2fr_repeat(4,1fr)] md:gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <ArkiveLogo className="size-10 text-foreground" />
              <span className="font-brand text-[25px] leading-none font-bold tracking-tight">
                nomi
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-[13px] leading-[1.5] text-muted-foreground">
              {tagline ??
                "AI study assistant that turns PDFs, lectures, and notes into flashcards, quizzes, summaries, and more."}
            </p>
            <div className="mt-5 flex items-center gap-2">
              <SocialLink
                href={DISCORD_INVITE_URL}
                aria-label="Discord"
                icon={
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-8"
                  >
                    <path
                      d="M2 11.6C2 8.23969 2 6.55953 2.65396 5.27606C3.2292 4.14708 4.14708 3.2292 5.27606 2.65396C6.55953 2 8.23969 2 11.6 2H20.4C23.7603 2 25.4405 2 26.7239 2.65396C27.8529 3.2292 28.7708 4.14708 29.346 5.27606C30 6.55953 30 8.23969 30 11.6V20.4C30 23.7603 30 25.4405 29.346 26.7239C28.7708 27.8529 27.8529 28.7708 26.7239 29.346C25.4405 30 23.7603 30 20.4 30H11.6C8.23969 30 6.55953 30 5.27606 29.346C4.14708 28.7708 3.2292 27.8529 2.65396 26.7239C2 25.4405 2 23.7603 2 20.4V11.6Z"
                      fill="url(#paint0_linear_1609_985)"
                    />
                    <path
                      d="M24.2752 10.0267C22.7615 8.74667 20.945 8.10667 19.0275 8L18.7248 8.32C20.4404 8.74667 21.9541 9.6 23.367 10.7733C21.6514 9.81333 19.7339 9.17333 17.7156 8.96C17.1101 8.85333 16.6055 8.85333 16 8.85333C15.3945 8.85333 14.8899 8.85333 14.2844 8.96C12.2661 9.17333 10.3486 9.81333 8.63303 10.7733C10.0459 9.6 11.5596 8.74667 13.2752 8.32L12.9725 8C11.055 8.10667 9.23853 8.74667 7.72477 10.0267C6.00917 13.44 5.10092 17.28 5 21.2267C6.51376 22.9333 8.63303 24 10.8532 24C10.8532 24 11.5596 23.1467 12.0642 22.4C10.7523 22.08 9.54128 21.3333 8.73395 20.16C9.44037 20.5867 10.1468 21.0133 10.8532 21.3333C11.7615 21.76 12.6697 21.9733 13.578 22.1867C14.3853 22.2933 15.1927 22.4 16 22.4C16.8073 22.4 17.6147 22.2933 18.422 22.1867C19.3303 21.9733 20.2385 21.76 21.1468 21.3333C21.8532 21.0133 22.5596 20.5867 23.2661 20.16C22.4587 21.3333 21.2477 22.08 19.9358 22.4C20.4404 23.1467 21.1468 24 21.1468 24C23.367 24 25.4862 22.9333 27 21.2267C26.8991 17.28 25.9908 13.44 24.2752 10.0267ZM12.6697 19.3067C11.6606 19.3067 10.7523 18.3467 10.7523 17.1733C10.7523 16 11.6606 15.04 12.6697 15.04C13.6789 15.04 14.5872 16 14.5872 17.1733C14.5872 18.3467 13.6789 19.3067 12.6697 19.3067ZM19.3303 19.3067C18.3211 19.3067 17.4128 18.3467 17.4128 17.1733C17.4128 16 18.3211 15.04 19.3303 15.04C20.3394 15.04 21.2477 16 21.2477 17.1733C21.2477 18.3467 20.3394 19.3067 19.3303 19.3067Z"
                      fill="white"
                    />
                    <defs>
                      <linearGradient
                        id="paint0_linear_1609_985"
                        x1="16"
                        y1="2"
                        x2="16"
                        y2="30"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#687EC9" />
                        <stop offset="1" stopColor="#5971C3" />
                      </linearGradient>
                    </defs>
                  </svg>
                }
              />
              <SocialLink
                href="https://www.instagram.com/nomi.study/"
                aria-label="Instagram"
                icon={
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-8"
                  >
                    <rect
                      x="2"
                      y="2"
                      width="28"
                      height="28"
                      rx="6"
                      fill="url(#paint0_radial_1609_971)"
                    />
                    <rect
                      x="2"
                      y="2"
                      width="28"
                      height="28"
                      rx="6"
                      fill="url(#paint1_radial_1609_971)"
                    />
                    <rect
                      x="2"
                      y="2"
                      width="28"
                      height="28"
                      rx="6"
                      fill="url(#paint2_radial_1609_971)"
                    />
                    <path
                      d="M23 10.5C23 11.3284 22.3284 12 21.5 12C20.6716 12 20 11.3284 20 10.5C20 9.67157 20.6716 9 21.5 9C22.3284 9 23 9.67157 23 10.5Z"
                      fill="white"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M16 21C18.7614 21 21 18.7614 21 16C21 13.2386 18.7614 11 16 11C13.2386 11 11 13.2386 11 16C11 18.7614 13.2386 21 16 21ZM16 19C17.6569 19 19 17.6569 19 16C19 14.3431 17.6569 13 16 13C14.3431 13 13 14.3431 13 16C13 17.6569 14.3431 19 16 19Z"
                      fill="white"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10 5C7.23858 5 5 7.23858 5 10V22C5 24.7614 7.23858 27 10 27H22C24.7614 27 27 24.7614 27 22V10C27 7.23858 24.7614 5 22 5H10ZM22 7H10C8.34315 7 7 8.34315 7 10V22C7 23.6569 8.34315 25 10 25H22C23.6569 25 25 23.6569 25 22V10C25 8.34315 23.6569 7 22 7Z"
                      fill="white"
                    />
                    <defs>
                      <radialGradient
                        id="paint0_radial_1609_971"
                        cx="0"
                        cy="0"
                        r="1"
                        gradientUnits="userSpaceOnUse"
                        gradientTransform="translate(8 28) rotate(-55.3758) scale(28.125)"
                      >
                        <stop stopColor="#FD5" />
                        <stop offset=".5" stopColor="#FF543E" />
                        <stop offset="1" stopColor="#C837AB" />
                      </radialGradient>
                      <radialGradient
                        id="paint1_radial_1609_971"
                        cx="0"
                        cy="0"
                        r="1"
                        gradientUnits="userSpaceOnUse"
                        gradientTransform="translate(28 28) rotate(-135) scale(25.4558)"
                      >
                        <stop stopColor="#3771C8" />
                        <stop offset=".128" stopColor="#3771C8" stopOpacity="0" />
                      </radialGradient>
                      <radialGradient
                        id="paint2_radial_1609_971"
                        cx="0"
                        cy="0"
                        r="1"
                        gradientUnits="userSpaceOnUse"
                        gradientTransform="translate(2 2) rotate(45) scale(21)"
                      >
                        <stop stopColor="#6DBF18" />
                        <stop offset=".445" stopColor="#6DBF18" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                  </svg>
                }
              />
              <SocialLink
                href="https://www.threads.net/@nomi.study"
                aria-label="Threads"
                icon={
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 512 512"
                    className="size-8"
                  >
                    <path d="M105 0h302c57.75 0 105 47.25 105 105v302c0 57.75-47.25 105-105 105H105C47.25 512 0 464.75 0 407V105C0 47.25 47.25 0 105 0z" />
                    <path
                      fill="#fff"
                      fillRule="nonzero"
                      d="M337.36 243.58c-1.46-.7-2.95-1.38-4.46-2.02-2.62-48.36-29.04-76.05-73.41-76.33-25.6-.17-48.52 10.27-62.8 31.94l24.4 16.74c10.15-15.4 26.08-18.68 37.81-18.68h.4c14.61.09 25.64 4.34 32.77 12.62 5.19 6.04 8.67 14.37 10.39 24.89-12.96-2.2-26.96-2.88-41.94-2.02-42.18 2.43-69.3 27.03-67.48 61.21.92 17.35 9.56 32.26 24.32 42.01 12.48 8.24 28.56 12.27 45.26 11.35 22.07-1.2 39.37-9.62 51.45-25.01 9.17-11.69 14.97-26.84 17.53-45.92 10.51 6.34 18.3 14.69 22.61 24.73 7.31 17.06 7.74 45.1-15.14 67.96-20.04 20.03-44.14 28.69-80.55 28.96-40.4-.3-70.95-13.26-90.81-38.51-18.6-23.64-28.21-57.79-28.57-101.5.36-43.71 9.97-77.86 28.57-101.5 19.86-25.25 50.41-38.21 90.81-38.51 40.68.3 71.76 13.32 92.39 38.69 10.11 12.44 17.73 28.09 22.76 46.33l28.59-7.63c-6.09-22.45-15.67-41.8-28.72-57.85-26.44-32.53-65.1-49.19-114.92-49.54h-.2c-49.72.35-87.96 17.08-113.64 49.73-22.86 29.05-34.65 69.48-35.04 120.16v.24c.39 50.68 12.18 91.11 35.04 120.16 25.68 32.65 63.92 49.39 113.64 49.73h.2c44.2-.31 75.36-11.88 101.03-37.53 33.58-33.55 32.57-75.6 21.5-101.42-7.94-18.51-23.08-33.55-43.79-43.48zm-76.32 71.76c-18.48 1.04-37.69-7.26-38.64-25.03-.7-13.18 9.38-27.89 39.78-29.64 3.48-.2 6.9-.3 10.25-.3 11.04 0 21.37 1.07 30.76 3.13-3.5 43.74-24.04 50.84-42.15 51.84z"
                    />
                  </svg>
                }
              />
              <SocialLink
                href="https://www.youtube.com/channel/UC8IQDvAivAUdle1m1qH9Rzg"
                aria-label="YouTube"
                icon={
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-8"
                  >
                    <path
                      d="M2.24451 9.94111C2.37304 7.96233 3.96395 6.41157 5.94447 6.31345C8.81239 6.17136 12.9115 6 16 6C19.0885 6 23.1876 6.17136 26.0555 6.31345C28.0361 6.41157 29.627 7.96233 29.7555 9.94111C29.8786 11.8369 30 14.1697 30 16C30 17.8303 29.8786 20.1631 29.7555 22.0589C29.627 24.0377 28.0361 25.5884 26.0555 25.6866C23.1876 25.8286 19.0885 26 16 26C12.9115 26 8.81239 25.8286 5.94447 25.6866C3.96395 25.5884 2.37304 24.0377 2.24451 22.0589C2.12136 20.1631 2 17.8303 2 16C2 14.1697 2.12136 11.8369 2.24451 9.94111Z"
                      fill="#FC0D1B"
                    />
                    <path d="M13 12V20L21 16L13 12Z" fill="white" />
                  </svg>
                }
              />
            </div>
          </div>

          <ColumnList column={STUDY_TOOLS} />

          {columns.map((col) => (
            <ColumnList key={col.title} column={col} />
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-[12px] text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} nomi.{" "}
            {copyright ?? "All rights reserved."}
          </p>
          <p>{madeIn ?? ""}</p>
        </div>
      </div>
    </footer>
  )
}
