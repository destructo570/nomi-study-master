import type { Metadata } from "next"
import { SeoPage } from "@/components/seo/seo-page"

export const metadata: Metadata = {
  title: "AI Flashcard Generator — nomi",
  description:
    "Generate study-ready flashcards from notes, PDFs, videos, and textbooks using AI. Free AI flashcard generator for students.",
  openGraph: {
    title: "AI Flashcard Generator — nomi",
    description:
      "Generate study-ready flashcards from notes, PDFs, videos, and textbooks using AI.",
    url: "https://www.nomistudy.com/ai-flashcards",
    siteName: "nomi",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Flashcard Generator — nomi",
    description:
      "Generate study-ready flashcards from notes, PDFs, videos, and textbooks using AI.",
  },
  alternates: {
    canonical: "https://www.nomistudy.com/ai-flashcards",
  },
}

export default function AiFlashcardsPage() {
  return <SeoPage type="flashcards" />
}
