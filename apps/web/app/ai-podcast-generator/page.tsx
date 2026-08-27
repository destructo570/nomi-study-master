import type { Metadata } from "next"
import { SeoPage } from "@/components/seo/seo-page"

export const metadata: Metadata = {
  title: "AI Podcast Generator — nomi",
  description:
    "Turn notes, PDFs, and study materials into audio podcasts you can listen to anywhere. Free AI podcast generator for students.",
  openGraph: {
    title: "AI Podcast Generator — nomi",
    description:
      "Turn notes, PDFs, and study materials into audio podcasts you can listen to anywhere.",
    url: "https://www.nomistudy.com/ai-podcast-generator",
    siteName: "nomi",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Podcast Generator — nomi",
    description:
      "Turn notes, PDFs, and study materials into audio podcasts you can listen to anywhere.",
  },
  alternates: {
    canonical: "https://www.nomistudy.com/ai-podcast-generator",
  },
}

export default function AiPodcastGeneratorPage() {
  return <SeoPage type="podcast-generator" />
}
