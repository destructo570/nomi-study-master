import { createMiddleware } from "hono/factory"
import { eq } from "drizzle-orm"

import { db } from "@workspace/db"
import { users } from "@workspace/db/schema"

import type { AppEnv } from "../types"
import { auth } from "../lib/better-auth"
import { nextPlanForStatus, normalizeStatus } from "../lib/plan-check"

const PUBLIC_PATHS = ["/health", "/api/billing/webhook", "/api/discount"]
const PUBLIC_PREFIXES = ["/api/auth/"]

function isPublic(path: string): boolean {
  if (PUBLIC_PATHS.includes(path)) return true
  return PUBLIC_PREFIXES.some((p) => path.startsWith(p))
}

export const authContext = createMiddleware<AppEnv>(async (c, next) => {
  if (isPublic(c.req.path)) {
    return next()
  }

  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return c.json({ error: "unauthorized" }, 401)
  }

  c.set("userId", session.user.id)
  c.set("userEmail", session.user.email)
  c.set("userRole", (session.user as { role?: string }).role === "admin" ? "admin" : "user")
  const lang = (session.user as { language?: string }).language
  c.set("userLanguage", typeof lang === "string" && lang.length > 0 ? lang : "en")

  const plan = (session.user as { plan?: string }).plan
  if (plan === "pro") {
    const [row] = await db
      .select({
        status: users.subscriptionStatus,
        periodEnd: users.subscriptionCurrentPeriodEnd,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)
    const effective = nextPlanForStatus(
      normalizeStatus(row?.status),
      row?.periodEnd ?? null,
      new Date(),
    )
    c.set("userPlan", effective)
  } else {
    c.set("userPlan", "free")
  }

  await next()
})

export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  if (c.get("userRole") !== "admin") {
    return c.json({ error: "forbidden" }, 403)
  }
  await next()
})
