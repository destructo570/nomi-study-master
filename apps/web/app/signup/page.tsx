import type { Metadata } from "next"
import { Suspense } from "react"

import { SignupForm } from "./signup-form"

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Start studying with the #1 AI study assistant. Generate summaries, notes, flashcards, and quizzes from your own lectures, PDFs, and articles.",
  alternates: { canonical: "/signup" },
  openGraph: {
    title: "Create your account · nomi",
    description:
      "Start studying with the #1 AI study assistant for students. Free to try.",
    url: "/signup",
  },
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  )
}
