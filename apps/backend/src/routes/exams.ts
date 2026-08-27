import { Hono } from "hono"
import { and, eq, inArray } from "drizzle-orm"

import { db } from "@workspace/db"
import { exams } from "@workspace/db/schema"

import { ownedNotebookIds, requireOwnedExam } from "../lib/ownership"
import type { AppEnv } from "../types"

const router = new Hono<AppEnv>()

router.delete("/:id", async (c) => {
  const id = c.req.param("id")
  const userId = c.get("userId")
  await requireOwnedExam(userId, id)
  await db
    .delete(exams)
    .where(
      and(eq(exams.id, id), inArray(exams.notebookId, ownedNotebookIds(userId))),
    )
  return c.json({ ok: true })
})

export default router
