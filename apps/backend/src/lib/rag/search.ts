import { sql } from "drizzle-orm"

import { db } from "@workspace/db"

export type SearchHit = {
  id: string
  sourceId: string
  sourceTitle: string
  page: number
  text: string
  score: number
}

function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`
}

export async function searchChunks(
  notebookId: string,
  queryEmbedding: number[],
  k = 8,
): Promise<SearchHit[]> {
  const lit = toVectorLiteral(queryEmbedding)
  const rows = await db.execute<{
    id: string
    source_id: string
    source_title: string
    page: number
    text: string
    distance: number
  }>(sql`
    SELECT
      c.id,
      c.source_id,
      s.title AS source_title,
      c.page,
      c.text,
      (c.embedding <=> ${lit}::vector) AS distance
    FROM source_chunks c
    JOIN sources s ON s.id = c.source_id
    WHERE c.notebook_id = ${notebookId} AND s.archived_at IS NULL
    ORDER BY c.embedding <=> ${lit}::vector
    LIMIT ${k}
  `)

  return rows.map((r) => ({
    id: r.id,
    sourceId: r.source_id,
    sourceTitle: r.source_title,
    page: r.page,
    text: r.text,
    score: 1 - Number(r.distance),
  }))
}

export async function searchChunksBySource(
  sourceId: string,
  queryEmbedding: number[],
  k = 8,
): Promise<SearchHit[]> {
  const lit = toVectorLiteral(queryEmbedding)
  const rows = await db.execute<{
    id: string
    source_id: string
    source_title: string
    page: number
    text: string
    distance: number
  }>(sql`
    SELECT
      c.id,
      c.source_id,
      s.title AS source_title,
      c.page,
      c.text,
      (c.embedding <=> ${lit}::vector) AS distance
    FROM source_chunks c
    JOIN sources s ON s.id = c.source_id
    WHERE c.source_id = ${sourceId}
    ORDER BY c.embedding <=> ${lit}::vector
    LIMIT ${k}
  `)

  return rows.map((r) => ({
    id: r.id,
    sourceId: r.source_id,
    sourceTitle: r.source_title,
    page: r.page,
    text: r.text,
    score: 1 - Number(r.distance),
  }))
}
