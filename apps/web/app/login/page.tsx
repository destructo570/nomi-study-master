import type { Metadata } from "next"
import { Suspense } from "react"

import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to nomi - the #1 AI study assistant for students. Continue with Google or email.",
  alternates: { canonical: "/login" },
  openGraph: {
    title: "Sign in · nomi",
    description:
      "Sign in to nomi - the #1 AI study assistant for students.",
    url: "/login",
  },
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
