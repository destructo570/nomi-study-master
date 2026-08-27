import type { ErrorHandler } from "hono"
import { HTTPException } from "hono/http-exception"
import { ZodError } from "zod"

import { PlanLimitError, QuotaExceededError } from "../lib/quota"
import { RateLimitError } from "../lib/rate-limit"

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof ZodError) {
    return c.json({ error: "Invalid request", detail: err.issues }, 400)
  }
  if (err instanceof RateLimitError) {
    return err.toResponse()
  }
  if (err instanceof QuotaExceededError) {
    return err.toResponse()
  }
  if (err instanceof PlanLimitError) {
    return err.toResponse()
  }
  if (err instanceof HTTPException) {
    return err.getResponse()
  }
  console.error("[backend] unhandled error:", err)
  return c.json({ error: "Internal server error" }, 500)
}
