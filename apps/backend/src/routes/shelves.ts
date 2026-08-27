import { Hono } from "hono"
import { and, asc, eq, isNull, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { z } from "zod"

import { db } from "@workspace/db"
import { shelves } from "@workspace/db/schema"
import { toShelf } from "@workspace/db/serialize"

import type { AppEnv } from "../types"

const router = new Hono<AppEnv>()

router.get("/", async (c) => {
  const userId = c.get("userId")
  const rows = await db
    .select()
    .from(shelves)
    .where(and(eq(shelves.userId, userId), isNull(shelves.archivedAt)))
    .orderBy(asc(shelves.createdAt))
  return c.json(rows.map(toShelf))
})

const createSchema = z.object({ name: z.string().min(1) })

router.post("/", async (c) => {
  const body = createSchema.parse(await c.req.json())
  const userId = c.get("userId")
  const [row] = await db
    .insert(shelves)
    .values({ id: nanoid(8), userId, name: body.name })
    .returning()
  return c.json(toShelf(row!))
})

router.get("/:id", async (c) => {
  const id = c.req.param("id")
  const userId = c.get("userId")
  const [row] = await db
    .select()
    .from(shelves)
    .where(and(eq(shelves.id, id), eq(shelves.userId, userId)))
    .limit(1)
  return c.json(row ? toShelf(row) : null)
})

const patchSchema = z.object({ name: z.string().min(1) })

router.patch("/:id", async (c) => {
  const id = c.req.param("id")
  const userId = c.get("userId")
  const body = patchSchema.parse(await c.req.json())
  const [row] = await db
    .update(shelves)
    .set({ name: body.name })
    .where(and(eq(shelves.id, id), eq(shelves.userId, userId)))
    .returning()
  return c.json(row ? toShelf(row) : null)
})

router.delete("/:id", async (c) => {
  const id = c.req.param("id")
  const userId = c.get("userId")
  await db
    .update(shelves)
    .set({ archivedAt: sql`now()` })
    .where(and(eq(shelves.id, id), eq(shelves.userId, userId)))
  return c.json({ ok: true })
})

export default router
