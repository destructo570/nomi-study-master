-- RAG: pgvector extension, source_chunks table, supporting indexes,
-- index-status columns on sources, citations on chat_messages.
--
-- Apply with:
--   psql "$DATABASE_URL" -f packages/db/drizzle/manual/0004_rag.sql
-- Idempotent and safe to run twice.

BEGIN;

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "sources"
  ADD COLUMN IF NOT EXISTS "indexed_at"  timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "index_error" text;

ALTER TABLE "chat_messages"
  ADD COLUMN IF NOT EXISTS "citations" jsonb;

CREATE TABLE IF NOT EXISTS "source_chunks" (
  "id"           text PRIMARY KEY,
  "source_id"    text NOT NULL REFERENCES "sources"("id")   ON DELETE CASCADE,
  "notebook_id"  text NOT NULL REFERENCES "notebooks"("id") ON DELETE CASCADE,
  "page"         integer NOT NULL,
  "ord"          integer NOT NULL,
  "text"         text    NOT NULL,
  "token_count"  integer NOT NULL,
  "embedding"    vector(1536) NOT NULL,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "source_chunks_source_idx"
  ON "source_chunks" ("source_id");

CREATE INDEX IF NOT EXISTS "source_chunks_notebook_idx"
  ON "source_chunks" ("notebook_id");

CREATE INDEX IF NOT EXISTS "source_chunks_embedding_hnsw_idx"
  ON "source_chunks" USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

COMMIT;
