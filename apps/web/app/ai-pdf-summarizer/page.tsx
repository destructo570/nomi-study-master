import type { Metadata } from "next"
import { SeoPage } from "@/components/seo/seo-page"

export const metadata: Metadata = {
  title: "AI PDF Summarizer — nomi",
  description:
    "Upload any PDF and get concise AI-powered summaries, study notes, flashcards, and more in seconds. Free AI PDF summarizer for students.",
  openGraph: {
    title: "AI PDF Summarizer — nomi",
    description:
      "Upload any PDF and get concise AI-powered summaries, study notes, flashcards, and more in seconds.",
    url: "https://www.nomistudy.com/ai-pdf-summarizer",
    siteName: "nomi",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI PDF Summarizer — nomi",
    description:
      "Upload any PDF and get concise AI-powered summaries, study notes, flashcards, and more in seconds.",
  },
  alternates: {
    canonical: "https://www.nomistudy.com/ai-pdf-summarizer",
  },
}

export default function AiPdfSummarizerPage() {
  return <SeoPage type="pdf-summarizer" />
}
