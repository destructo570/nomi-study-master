import type { Context } from "hono"
import { HTTPException } from "hono/http-exception"

import type { Plan } from "@workspace/types"

import type { AppEnv } from "../types"
import { getConnection } from "./queue"

export class RateLimitError extends HTTPException {
  retryAfterSeconds: number
  limit: number
  windowLabel: string

  constructor(opts: {
    retryAfterSeconds: number
    limit: number
    windowLabel: string
    message: string
  }) {
    super(429, { message: opts.message })
    this.retryAfterSeconds = opts.retryAfterSeconds
    this.limit = opts.limit
    this.windowLabel = opts.windowLabel
  }

  toResponse(): Response {
    return new Response(
      JSON.stringify({
        error: "rate_limited",
        message: this.message,
        retryAfterSeconds: this.retryAfterSeconds,
        limit: this.limit,
        window: this.windowLabel,
      }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(this.retryAfterSeconds),
        },
      },
    )
  }
}

type Window = { limit: number; windowSec: number; label: string }

function num(name: string, fallback: number): number {
  const v = process.env[name]
  if (!v) return fallback
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function windowsFor(plan: Plan): Window[] {
  if (plan === "pro") {
    return [
      { limit: num("OPENAI_RL_PRO_PER_MIN", 60), windowSec: 60, label: "minute" },
      { limit: num("OPENAI_RL_PRO_PER_HOUR", 1000), windowSec: 3600, label: "hour" },
    ]
  }
  return [
    { limit: num("OPENAI_RL_FREE_PER_MIN", 10), windowSec: 60, label: "minute" },
    { limit: num("OPENAI_RL_FREE_PER_HOUR", 100), windowSec: 3600, label: "hour" },
  ]
}

let warned = false

function warnOnce(prefix: string, err: unknown): void {
  if (warned) return
  warned = true
  console.warn(`[rate-limit] ${prefix}:`, err instanceof Error ? err.message : err)
}

export async function enforceOpenAIRateLimit(c: Context<AppEnv>): Promise<void> {
  await enforceOpenAIRateLimitForUser(c.get("userId"), c.get("userPlan"))
}

export async function enforceOpenAIRateLimitForUser(
  userId: string,
  plan: Plan,
): Promise<void> {
  if (process.env.RATE_LIMIT_DISABLED === "1") return

  let redis
  try {
    redis = getConnection()
  } catch (err) {
    warnOnce("disabled — Redis not configured", err)
    return
  }

  const now = Math.floor(Date.now() / 1000)
  for (const w of windowsFor(plan)) {
    const bucket = Math.floor(now / w.windowSec)
    const key = `rl:openai:${userId}:${w.windowSec}:${bucket}`
    let count: number
    try {
      count = await redis.incr(key)
      if (count === 1) {
        await redis.expire(key, w.windowSec + 5)
      }
    } catch (err) {
      warnOnce("redis error, allowing request", err)
      return
    }
    if (count > w.limit) {
      let retryAfter = w.windowSec
      try {
        const ttl = await redis.ttl(key)
        if (ttl > 0) retryAfter = ttl
      } catch {
        // keep default
      }
      const friendly =
        plan === "pro"
          ? `You're sending requests too fast (${w.limit} per ${w.label}). Please wait ${retryAfter}s and try again.`
          : `You've hit the free-plan request limit (${w.limit} per ${w.label}). Wait ${retryAfter}s, or upgrade to Pro for higher limits.`
      throw new RateLimitError({
        retryAfterSeconds: retryAfter,
        limit: w.limit,
        windowLabel: w.label,
        message: friendly,
      })
    }
  }
}
