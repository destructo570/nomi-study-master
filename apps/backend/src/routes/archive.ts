import { Hono } from "hono"
import { and, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "@workspace/db"
import { notebooks, shelves, sources } from "@workspace/db/schema"
import { toNotebook, toShelf, toSource } from "@workspace/db/serialize"

import type { AppEnv } from "../types"
import { ownedNotebookIds } from "../lib/ownership"
import { deleteObject } from "../lib/storage/r2"

const router = new Hono<AppEnv>()

// Best-effort R2 cleanup. We never let storage failures roll back the DB
// delete — orphaning a file is recoverable, leaving a row pointing at a
// deleted blob is not.
async function purgeR2Keys(keys: string[]): Promise<void> {
  if (keys.length === 0) return
  const results = await Promise.allSettled(keys.map((k) => deleteObject(k)))
  for (const [i, r] of results.entries()) {
    if (r.status === "rejected") {
      console.error(`[archive] R2 delete failed for ${keys[i]}:`, r.reason)
    }
  }
}

async function storageKeysForShelf(
  userId: string,
  shelfId: string,
): Promise<string[]> {
  const rows = await db
    .select({ key: sources.storageKey })
    .from(sources)
    .innerJoin(notebooks, eq(notebooks.id, sources.notebookId))
    .where(
      and(
        eq(notebooks.shelfId, shelfId),
        eq(notebooks.userId, userId),
        isNotNull(sources.storageKey),
      ),
    )
  return rows.map((r) => r.key as string)
}

async function storageKeysForNotebook(
  userId: string,
  notebookId: string,
): Promise<string[]> {
  const rows = await db
    .select({ key: sources.storageKey })
    .from(sources)
    .innerJoin(notebooks, eq(notebooks.id, sources.notebookId))
    .where(
      and(
        eq(sources.notebookId, notebookId),
        eq(notebooks.userId, userId),
        isNotNull(sources.storageKey),
      ),
    )
  return rows.map((r) => r.key as string)
}

async function storageKeyForSource(
  userId: string,
  sourceId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ key: sources.storageKey })
    .from(sources)
    .innerJoin(notebooks, eq(notebooks.id, sources.notebookId))
    .where(and(eq(sources.id, sourceId), eq(notebooks.userId, userId)))
    .limit(1)
  return row?.key ?? null
}

router.get("/", async (c) => {
  const userId = c.get("userId")

  const archivedShelves = await db
    .select()
    .from(shelves)
    .where(and(isNotNull(shelves.archivedAt), eq(shelves.userId, userId)))
    .orderBy(desc(shelves.archivedAt))

  const archivedNotebookRows = await db
    .select({ nb: notebooks, shelfName: shelves.name })
    .from(notebooks)
    .innerJoin(shelves, eq(shelves.id, notebooks.shelfId))
    .where(
      and(
        isNotNull(notebooks.archivedAt),
        isNull(shelves.archivedAt),
        eq(notebooks.userId, userId),
      ),
    )
    .orderBy(desc(notebooks.archivedAt))

  const archivedSourceRows = await db
    .select({
      src: sources,
      notebookTitle: notebooks.title,
    })
    .from(sources)
    .innerJoin(notebooks, eq(notebooks.id, sources.notebookId))
    .innerJoin(shelves, eq(shelves.id, notebooks.shelfId))
    .where(
      and(
        isNotNull(sources.archivedAt),
        isNull(notebooks.archivedAt),
        isNull(shelves.archivedAt),
        eq(notebooks.userId, userId),
      ),
    )
    .orderBy(desc(sources.archivedAt))

  return c.json({
    shelves: archivedShelves.map(toShelf),
    notebooks: archivedNotebookRows.map((r) => ({
      ...toNotebook(r.nb),
      shelfName: r.shelfName,
    })),
    sources: archivedSourceRows.map((r) => ({
      ...toSource(r.src),
      notebookTitle: r.notebookTitle,
    })),
  })
})

const itemSchema = z.object({
  type: z.enum(["shelf", "notebook", "source"]),
  id: z.string().min(1),
})

router.post("/restore", async (c) => {
  const userId = c.get("userId")
  const body = itemSchema.parse(await c.req.json())
  if (body.type === "shelf") {
    const result = await db
      .update(shelves)
      .set({ archivedAt: null })
      .where(and(eq(shelves.id, body.id), eq(shelves.userId, userId)))
      .returning({ id: shelves.id })
    if (result.length === 0) return c.json({ error: "not_found" }, 404)
  } else if (body.type === "notebook") {
    const result = await db
      .update(notebooks)
      .set({ archivedAt: null, updatedAt: sql`now()` })
      .where(and(eq(notebooks.id, body.id), eq(notebooks.userId, userId)))
      .returning({ id: notebooks.id })
    if (result.length === 0) return c.json({ error: "not_found" }, 404)
  } else {
    // sources don't carry userId — verify ownership via the parent notebook.
    const [src] = await db
      .select({ id: sources.id })
      .from(sources)
      .innerJoin(notebooks, eq(notebooks.id, sources.notebookId))
      .where(and(eq(sources.id, body.id), eq(notebooks.userId, userId)))
      .limit(1)
    if (!src) return c.json({ error: "not_found" }, 404)
    await db
      .update(sources)
      .set({ archivedAt: null })
      .where(
        and(
          eq(sources.id, body.id),
          inArray(sources.notebookId, ownedNotebookIds(userId)),
        ),
      )
  }
  return c.json({ ok: true })
})

router.delete("/:type/:id", async (c) => {
  const userId = c.get("userId")
  const type = c.req.param("type")
  const id = c.req.param("id")
  if (type === "shelf") {
    const keys = await storageKeysForShelf(userId, id)
    const deleted = await db
      .delete(shelves)
      .where(
        and(
          eq(shelves.id, id),
          eq(shelves.userId, userId),
          isNotNull(shelves.archivedAt),
        ),
      )
      .returning({ id: shelves.id })
    if (deleted.length === 0) return c.json({ error: "not_found" }, 404)
    await purgeR2Keys(keys)
  } else if (type === "notebook") {
    const keys = await storageKeysForNotebook(userId, id)
    const deleted = await db
      .delete(notebooks)
      .where(
        and(
          eq(notebooks.id, id),
          eq(notebooks.userId, userId),
          isNotNull(notebooks.archivedAt),
        ),
      )
      .returning({ id: notebooks.id })
    if (deleted.length === 0) return c.json({ error: "not_found" }, 404)
    await purgeR2Keys(keys)
  } else if (type === "source") {
    const key = await storageKeyForSource(userId, id)
    // Verify ownership via the parent notebook before deleting.
    const [src] = await db
      .select({ id: sources.id })
      .from(sources)
      .innerJoin(notebooks, eq(notebooks.id, sources.notebookId))
      .where(
        and(
          eq(sources.id, id),
          eq(notebooks.userId, userId),
          isNotNull(sources.archivedAt),
        ),
      )
      .limit(1)
    if (!src) return c.json({ error: "not_found" }, 404)
    await db
      .delete(sources)
      .where(
        and(
          eq(sources.id, id),
          inArray(sources.notebookId, ownedNotebookIds(userId)),
        ),
      )
    if (key) await purgeR2Keys([key])
  } else {
    return c.json({ error: "invalid type" }, 400)
  }
  return c.json({ ok: true })
})

router.post("/empty", async (c) => {
  const userId = c.get("userId")

  // Collect every storageKey reachable from anything currently in the
  // current user's trash (archived shelves cascade to their notebooks /
  // sources; archived notebooks cascade to their sources; archived
  // sources directly). Deduped to avoid double R2 calls.
  const trashedShelfIds = (
    await db
      .select({ id: shelves.id })
      .from(shelves)
      .where(and(isNotNull(shelves.archivedAt), eq(shelves.userId, userId)))
  ).map((r) => r.id)

  const trashedNotebookIds = (
    await db
      .select({ id: notebooks.id })
      .from(notebooks)
      .where(
        and(isNotNull(notebooks.archivedAt), eq(notebooks.userId, userId)),
      )
  ).map((r) => r.id)

  const keys = new Set<string>()

  if (trashedShelfIds.length > 0) {
    const rows = await db
      .select({ key: sources.storageKey })
      .from(sources)
      .innerJoin(notebooks, eq(notebooks.id, sources.notebookId))
      .where(
        and(
          inArray(notebooks.shelfId, trashedShelfIds),
          isNotNull(sources.storageKey),
        ),
      )
    for (const r of rows) if (r.key) keys.add(r.key)
  }

  if (trashedNotebookIds.length > 0) {
    const rows = await db
      .select({ key: sources.storageKey })
      .from(sources)
      .where(
        and(
          inArray(sources.notebookId, trashedNotebookIds),
          isNotNull(sources.storageKey),
        ),
      )
    for (const r of rows) if (r.key) keys.add(r.key)
  }

  const archivedSourceRows = await db
    .select({ key: sources.storageKey })
    .from(sources)
    .innerJoin(notebooks, eq(notebooks.id, sources.notebookId))
    .where(
      and(
        isNotNull(sources.archivedAt),
        isNotNull(sources.storageKey),
        eq(notebooks.userId, userId),
      ),
    )
  for (const r of archivedSourceRows) if (r.key) keys.add(r.key)

  await db.transaction(async (tx) => {
    // Sources: archived AND owned by this user (via notebook).
    const archivedOwnedSourceIds = (
      await tx
        .select({ id: sources.id })
        .from(sources)
        .innerJoin(notebooks, eq(notebooks.id, sources.notebookId))
        .where(
          and(isNotNull(sources.archivedAt), eq(notebooks.userId, userId)),
        )
    ).map((r) => r.id)
    if (archivedOwnedSourceIds.length > 0) {
      await tx.delete(sources).where(inArray(sources.id, archivedOwnedSourceIds))
    }
    await tx
      .delete(notebooks)
      .where(
        and(isNotNull(notebooks.archivedAt), eq(notebooks.userId, userId)),
      )
    await tx
      .delete(shelves)
      .where(and(isNotNull(shelves.archivedAt), eq(shelves.userId, userId)))
  })

  await purgeR2Keys([...keys])

  return c.json({ ok: true })
})

export default router
