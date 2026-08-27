import { eq } from "drizzle-orm"

import { db } from "@workspace/db"
import { notebooks, sources, users } from "@workspace/db/schema"
import type { Plan } from "@workspace/types"

/**
 * Look up the plan of the user who owns the given source. Used by background
 * workers that don't have a request context. Falls back to "free" if the join
 * fails for any reason (e.g. orphaned source).
 */
export async function getUserPlanForSource(sourceId: string): Promise<Plan> {
  const [row] = await db
    .select({ plan: users.plan })
    .from(sources)
    .innerJoin(notebooks, eq(notebooks.id, sources.notebookId))
    .innerJoin(users, eq(users.id, notebooks.userId))
    .where(eq(sources.id, sourceId))
    .limit(1)
  return (row?.plan === "pro" ? "pro" : "free") as Plan
}

export async function getUserAndPlanForSource(
  sourceId: string,
): Promise<{ userId: string; plan: Plan } | null> {
  const [row] = await db
    .select({ userId: notebooks.userId, plan: users.plan })
    .from(sources)
    .innerJoin(notebooks, eq(notebooks.id, sources.notebookId))
    .innerJoin(users, eq(users.id, notebooks.userId))
    .where(eq(sources.id, sourceId))
    .limit(1)
  if (!row) return null
  return {
    userId: row.userId,
    plan: (row.plan === "pro" ? "pro" : "free") as Plan,
  }
}

export async function getUserAndPlanForNotebook(
  notebookId: string,
): Promise<{ userId: string; plan: Plan } | null> {
  const [row] = await db
    .select({ userId: notebooks.userId, plan: users.plan })
    .from(notebooks)
    .innerJoin(users, eq(users.id, notebooks.userId))
    .where(eq(notebooks.id, notebookId))
    .limit(1)
  if (!row) return null
  return {
    userId: row.userId,
    plan: (row.plan === "pro" ? "pro" : "free") as Plan,
  }
}
