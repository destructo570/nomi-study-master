-- Adds a content_hash column to source_chunks so the embed worker can reuse
-- existing embeddings for identical chunk text instead of re-paying OpenAI.
-- Apply manually:
--   psql "$DATABASE_URL" -f packages/db/drizzle/manual/0010_source_chunk_content_hash.sql
-- Idempotent and safe to run twice.

BEGIN;

ALTER TABLE "source_chunks"
  ADD COLUMN IF NOT EXISTS "content_hash" text;

CREATE INDEX IF NOT EXISTS "source_chunks_content_hash_idx"
  ON "source_chunks" ("content_hash");

COMMIT;
