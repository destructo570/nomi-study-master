"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
} from "@workspace/ui/components/dialog"

import { authClient } from "@/lib/auth-client"
import { ArkiveLogo } from "@/components/app-sidebar"
import { GoogleIcon } from "@/components/auth/auth-shell"

const INPUT =
  "h-11 w-full border-x-0 border-t-0 border-b border-border bg-transparent px-0 text-[15px] text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-foreground"

const LABEL =
  "block text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground"

type AuthModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  function resetForm() {
    setName("")
    setEmail("")
    setPassword("")
    setError(null)
    setLoading(false)
    setGoogleLoading(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen)
    if (!nextOpen) resetForm()
  }

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
        return
      }
      handleOpenChange(false)
      router.push("/home")
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create account."
      )
    } finally {
      setLoading(false)
    }
  }

  async function onGoogle() {
    setError(null)
    setGoogleLoading(true)
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/home`,
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Google sign-in failed."
      )
      setGoogleLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <div className="flex flex-col items-center">
          <Link href="/" className="flex items-center gap-2">
            <ArkiveLogo className="size-[28px] text-foreground" />
            <span className="font-brand text-[20px] leading-none font-bold tracking-tight">
              nomi
            </span>
          </Link>

          <h1 className="mt-5 font-brand text-center text-[28px] font-bold tracking-[-0.02em] leading-[1.08] sm:text-[32px]">
            Built for Lifelong Learners.
          </h1>
          <p className="mt-2 text-center text-[14px] leading-[1.5] text-muted-foreground">
            Log in or create an account
          </p>

          <div className="mt-6 w-full">
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
                <label htmlFor="modal-name" className={LABEL}>
                  Name
                </label>
                <input
                  id="modal-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={INPUT}
                  placeholder="What should we call you?"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="modal-email" className={LABEL}>
                  Email
                </label>
                <input
                  id="modal-email"
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
                <label htmlFor="modal-password" className={LABEL}>
                  Password
                </label>
                <input
                  id="modal-password"
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

            <p className="mt-5 text-center text-[13px] leading-[1.5] text-muted-foreground">
              By continuing, you agree to our{" "}
              <Link
                href="/terms"
                className="text-foreground underline underline-offset-4 hover:opacity-70"
              >
                terms of service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-foreground underline underline-offset-4 hover:opacity-70"
              >
                privacy policy
              </Link>
              .
            </p>

            <p className="mt-3 text-center text-[13px] text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
