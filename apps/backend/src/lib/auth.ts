import type { Context } from "hono"

import type { AppEnv } from "../types"

export function getCurrentUserId(c: Context<AppEnv>): string {
  const id = c.get("userId")
  if (!id) throw new Error("getCurrentUserId called without authenticated session")
  return id
}

export function getCurrentUserEmail(c: Context<AppEnv>): string | null {
  return c.get("userEmail")
}
