import { eq } from "drizzle-orm"
import { Hono } from "hono"

import { db } from "@workspace/db"
import { misc } from "@workspace/db/schema"

import type { AppEnv } from "../types"

const router = new Hono<AppEnv>()

router.get("/", async (c) => {
  const [row] = await db
    .select({ id: misc.id, type: misc.type, value: misc.value })
    .from(misc)
    .where(eq(misc.type, "discount"))
    .limit(1)

  if (!row) {
    return c.json(null)
  }

  return c.json({
    title: row.value.title as string,
    code: row.value.code as string,
    time: row.value.time as number,
  })
})

export default router
