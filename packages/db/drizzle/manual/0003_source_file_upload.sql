-- Adds columns to sources for generic file upload + async extraction/transcription.
-- drizzle-kit introspection crashes on this project's DB, so apply manually:
--   psql "$DATABASE_URL" -f packages/db/drizzle/manual/0003_source_file_upload.sql
-- Idempotent and safe to run twice.

BEGIN;

ALTER TABLE "sources"
  ADD COLUMN IF NOT EXISTS "mime_type"       text,
  ADD COLUMN IF NOT EXISTS "file_name"       text,
  ADD COLUMN IF NOT EXISTS "file_size_bytes" integer,
  ADD COLUMN IF NOT EXISTS "storage_key"     text,
  ADD COLUMN IF NOT EXISTS "status"          text NOT NULL DEFAULT 'ready',
  ADD COLUMN IF NOT EXISTS "extracted_text"  text,
  ADD COLUMN IF NOT EXISTS "error_message"   text,
  ADD COLUMN IF NOT EXISTS "processed_at"    timestamp with time zone;

CREATE INDEX IF NOT EXISTS "sources_notebook_id_status_idx"
  ON "sources" ("notebook_id", "status");

COMMIT;
