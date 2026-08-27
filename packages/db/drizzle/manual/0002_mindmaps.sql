-- Adds mindmaps table for the notebook mindmap section.
-- drizzle-kit's introspection crashes on this project's DB, so apply this file manually:
--   psql "$DATABASE_URL" -f packages/db/drizzle/manual/0002_mindmaps.sql
-- Idempotent and safe to run twice.

BEGIN;

CREATE TABLE IF NOT EXISTS "mindmaps" (
  "id"          text PRIMARY KEY NOT NULL,
  "notebook_id" text NOT NULL REFERENCES "notebooks"("id") ON DELETE CASCADE,
  "title"       text NOT NULL,
  "prompt"      text,
  "data"        jsonb NOT NULL,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "mindmaps_notebook_id_created_at_idx"
  ON "mindmaps" ("notebook_id", "created_at" DESC);

COMMIT;
