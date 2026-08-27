-- Archive: soft-delete via nullable archived_at on shelves, notebooks, sources.
--
-- Apply with:
--   psql "$DATABASE_URL" -f packages/db/drizzle/manual/0006_archive.sql
-- Idempotent and safe to run twice.

BEGIN;

ALTER TABLE "shelves"
  ADD COLUMN IF NOT EXISTS "archived_at" timestamptz;

ALTER TABLE "notebooks"
  ADD COLUMN IF NOT EXISTS "archived_at" timestamptz;

ALTER TABLE "sources"
  ADD COLUMN IF NOT EXISTS "archived_at" timestamptz;

CREATE INDEX IF NOT EXISTS "shelves_archived_at_idx" ON "shelves" ("archived_at");
CREATE INDEX IF NOT EXISTS "notebooks_archived_at_idx" ON "notebooks" ("archived_at");
CREATE INDEX IF NOT EXISTS "sources_archived_at_idx" ON "sources" ("archived_at");

COMMIT;
