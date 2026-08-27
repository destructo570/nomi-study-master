import type { Metadata, Viewport } from "next"
import { Suspense } from "react"
import {
  Geist_Mono,
  Instrument_Serif,
  Inter,
  Bricolage_Grotesque,
} from "next/font/google"

import "@workspace/ui/globals.css"
import "highlight.js/styles/github.css"
import "katex/dist/katex.min.css"
import { Toaster } from "@workspace/ui/components/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/components/query-provider"
import { GoogleAnalytics } from "@/components/google-analytics"
import { MathEditDialog } from "@/components/editor/math-edit-dialog"
import { cn } from "@workspace/ui/lib/utils"

const SITE_NAME = "nomi"
const SITE_URL = "https://www.nomistudy.com"
const SITE_DESCRIPTION =
  "The #1 AI study assistant for students - turn your lectures, PDFs, and articles into summaries, notes, flashcards, and quizzes in seconds."
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - The #1 AI study assistant for students`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  keywords: [
    "AI study assistant",
    "AI tutor",
    "study notes generator",
    "flashcards from PDF",
    "lecture summary",
    "AI flashcards",
    "study with AI",
    "quiz generator",
    "PDF to notes",
    "students",
    "nomi",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - The #1 AI study assistant for students`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/images/hero-screenshot.webp`,
        width: 2400,
        height: 1500,
        alt: `${SITE_NAME} - AI study assistant dashboard`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - The #1 AI study assistant for students`,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/images/hero-screenshot.webp`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
}

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

// Display font: Inter (light weights mimic Waldenburg 300 whisper-weight)
const fontDisplay = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-display",
})

// Serif font for the wordmark / logo
const fontSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-serif",
})

const fontBrand = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-brand",
})

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icons/nomi-logo.svg`,
    description: SITE_DESCRIPTION,
    sameAs: [
      "https://www.instagram.com/nomi.study/",
      "https://www.threads.com/@nomi.study",
      "https://www.youtube.com/channel/UC8IQDvAivAUdle1m1qH9Rzg",
      "https://discord.gg/3ShYE6v2md",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  },
]

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable,
        fontDisplay.variable,
        fontSerif.variable,
        fontBrand.variable
      )}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {GA_MEASUREMENT_ID ? (
          <Suspense fallback={null}>
            <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />
          </Suspense>
        ) : null}
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
          <MathEditDialog />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
