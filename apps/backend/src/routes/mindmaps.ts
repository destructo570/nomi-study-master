import { Hono } from "hono"
import { and, eq, inArray, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "@workspace/db"
import { mindmaps } from "@workspace/db/schema"
import { toMindmap } from "@workspace/db/serialize"

import { ownedNotebookIds, requireOwnedMindmap } from "../lib/ownership"
import type { AppEnv } from "../types"

const router = new Hono<AppEnv>()

const flowNodeSchema = z.object({
  id: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.object({ label: z.string() }),
  type: z.string().optional(),
})

const flowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string().optional(),
})

const mindmapDataSchema = z.object({
  nodes: z.array(flowNodeSchema),
  edges: z.array(flowEdgeSchema),
})

const patchSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    data: mindmapDataSchema.optional(),
  })
  .refine((v) => v.title !== undefined || v.data !== undefined, {
    message: "empty patch",
  })

router.patch("/:id", async (c) => {
  const id = c.req.param("id")
  const userId = c.get("userId")
  await requireOwnedMindmap(userId, id)
  const body = patchSchema.parse(await c.req.json())
  const [row] = await db
    .update(mindmaps)
    .set({
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.data !== undefined ? { data: body.data } : {}),
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(mindmaps.id, id),
        inArray(mindmaps.notebookId, ownedNotebookIds(userId)),
      ),
    )
    .returning()
  if (!row) return c.json(null, 404)
  return c.json(toMindmap(row))
})

router.delete("/:id", async (c) => {
  const id = c.req.param("id")
  const userId = c.get("userId")
  await requireOwnedMindmap(userId, id)
  await db
    .delete(mindmaps)
    .where(
      and(
        eq(mindmaps.id, id),
        inArray(mindmaps.notebookId, ownedNotebookIds(userId)),
      ),
    )
  return c.json({ ok: true })
})

export default router
