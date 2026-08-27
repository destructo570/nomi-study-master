import type { Metadata } from "next"
import { SeoPage } from "@/components/seo/seo-page"

export const metadata: Metadata = {
  title: "AI Video Summarizer — nomi",
  description:
    "Summarize lectures, YouTube videos, and tutorials into concise notes and study materials. Free AI video summarizer for students.",
  openGraph: {
    title: "AI Video Summarizer — nomi",
    description:
      "Summarize lectures, YouTube videos, and tutorials into concise notes and study materials.",
    url: "https://www.nomistudy.com/ai-video-summarizer",
    siteName: "nomi",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Video Summarizer — nomi",
    description:
      "Summarize lectures, YouTube videos, and tutorials into concise notes and study materials.",
  },
  alternates: {
    canonical: "https://www.nomistudy.com/ai-video-summarizer",
  },
}

export default function AiVideoSummarizerPage() {
  return <SeoPage type="video-summarizer" />
}
