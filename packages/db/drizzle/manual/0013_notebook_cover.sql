-- Adds the cover column to notebooks.
--   notebooks.cover — short key like "vibrant_3" pointing at
--                     /apps/web/public/icons/notebook_bgs/<key>.webp.
-- Apply manually:
--   psql "$DATABASE_URL" -f packages/db/drizzle/manual/0013_notebook_cover.sql
-- Idempotent and safe to run twice.

BEGIN;

ALTER TABLE "notebooks" ADD COLUMN IF NOT EXISTS "cover" text;

COMMIT;
