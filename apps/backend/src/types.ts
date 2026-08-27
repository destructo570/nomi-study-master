import type { Plan, UserRole } from "@workspace/types"

export type AppEnv = {
  Variables: {
    userId: string
    userEmail: string | null
    userPlan: Plan
    userRole: UserRole
    /** ISO 639-1 — falls back to "en" when the column hasn't been backfilled. */
    userLanguage: string
  }
}
