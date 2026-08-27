import type { Metadata } from "next"
import { SeoPage } from "@/components/seo/seo-page"

export const metadata: Metadata = {
  title: "AI Quiz Maker — nomi",
  description:
    "Generate practice quizzes, MCQs, and tests from your notes, PDFs, and videos automatically. Free AI quiz maker for students.",
  openGraph: {
    title: "AI Quiz Maker — nomi",
    description:
      "Generate practice quizzes, MCQs, and tests from your notes, PDFs, and videos automatically.",
    url: "https://www.nomistudy.com/ai-quiz-maker",
    siteName: "nomi",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Quiz Maker — nomi",
    description:
      "Generate practice quizzes, MCQs, and tests from your notes, PDFs, and videos automatically.",
  },
  alternates: {
    canonical: "https://www.nomistudy.com/ai-quiz-maker",
  },
}

export default function AiQuizMakerPage() {
  return <SeoPage type="quiz-maker" />
}
