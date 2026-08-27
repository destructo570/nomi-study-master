"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import posthog from "posthog-js"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { authClient } from "@/lib/auth-client"
import { AuthShell, GoogleIcon } from "@/components/auth/auth-shell"

const INPUT =
  "h-11 w-full border-x-0 border-t-0 border-b border-border bg-transparent px-0 text-[15px] text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-foreground"

const LABEL =
  "block text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground"

export function LoginForm() {
  const router = useRouter()
  const search = useSearchParams()
  const next = search.get("next") ?? "/home"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const cleanEmail = email.trim()
    try {
      const res = await authClient.signIn.email({
        email: cleanEmail,
        password,
      })
      if (res.error) {
        setError(res.error.message ?? "Could not sign in.")
        posthog.capture("user_login_failed", {
          method: "email",
          error: res.error.message,
        })
        return
      }
      const userId =
        (res.data as { user?: { id?: string } } | undefined)?.user?.id ??
        cleanEmail
      posthog.identify(userId, { email: cleanEmail })
      posthog.capture("user_logged_in", { method: "email" })
      router.push(next)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.")
      posthog.captureException(err)
    } finally {
      setLoading(false)
    }
  }

  async function onGoogle() {
    setError(null)
    setGoogleLoading(true)
    posthog.capture("user_logged_in", { method: "google", stage: "redirect" })
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
          New here?{" "}
          <Link
            href={`/signup${next !== "/home" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            Create an account
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

      <div className="my-6 flex items-center gap-3 text-[12px] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onEmailSubmit} className="space-y-5">
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
            autoComplete="current-password"
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
          className={cn("h-11 w-full text-[14px]")}
          disabled={loading || googleLoading}
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  )
}
