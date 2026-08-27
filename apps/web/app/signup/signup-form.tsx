"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import posthog from "posthog-js"

import { Button } from "@workspace/ui/components/button"

import { authClient } from "@/lib/auth-client"
import { AuthShell, GoogleIcon } from "@/components/auth/auth-shell"

const INPUT =
  "h-11 w-full border-x-0 border-t-0 border-b border-border bg-transparent px-0 text-[15px] text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-foreground"

const LABEL =
  "block text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground"

export function SignupForm() {
  const router = useRouter()
  const search = useSearchParams()
  // const next = search.get("next") ?? "/onboarding"
  const next = search.get("next") ?? "/home"

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const cleanEmail = email.trim()
    const cleanName = name.trim() || email.split("@")[0]!
    try {
      const res = await authClient.signUp.email({
        email: cleanEmail,
        password,
        name: cleanName,
      })
      if (res.error) {
        setError(res.error.message ?? "Could not create account.")
        posthog.capture("user_signup_failed", {
          method: "email",
          error: res.error.message,
        })
        return
      }
      const userId =
        (res.data as { user?: { id?: string } } | undefined)?.user?.id ??
        cleanEmail
      posthog.identify(userId, { email: cleanEmail, name: cleanName })
      posthog.capture("user_signed_up", {
        method: "email",
        has_name: name.trim().length > 0,
      })
      router.push(next)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.")
      posthog.captureException(err)
    } finally {
      setLoading(false)
    }
  }

  async function onGoogle() {
    setError(null)
    setGoogleLoading(true)
    posthog.capture("user_signed_up", { method: "google", stage: "redirect" })
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}${next}`,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.")
      posthog.captureException(err)
      setGoogleLoading(false)
    }
  }

  return (
    <AuthShell
      title="Built for Lifelong Learners."
      subtitle="Log in or create an account"
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/login${next !== "/home" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-11 w-full justify-center text-[14px]"
        disabled={googleLoading || loading}
        onClick={onGoogle}
      >
        <GoogleIcon className="size-4" />
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </Button>

      <div className="my-4 flex items-center gap-3 text-[12px] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className={LABEL}>
            Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={INPUT}
            placeholder="What should we call you?"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className={LABEL}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={INPUT}
            placeholder="you@domain.com"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className={LABEL}>
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={INPUT}
            placeholder="At least 8 characters"
          />
        </div>

        {error && (
          <p className="text-[13px] text-muted-foreground">
            <span className="text-destructive">●</span> {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full text-[14px]"
          disabled={loading || googleLoading}
        >
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  )
}
