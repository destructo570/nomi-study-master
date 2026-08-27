-- Add a sourceUrl column to sources so URL-backed source types
-- (youtube, article) can keep the original URL separate from the
-- transcribed/extracted text that lands in `content`.
--
-- Apply manually:
--   psql "$DATABASE_URL" -f packages/db/drizzle/manual/0015_source_url.sql
-- Idempotent and safe to run twice.

BEGIN;

ALTER TABLE "sources"
  ADD COLUMN IF NOT EXISTS "source_url" text;

COMMIT;
