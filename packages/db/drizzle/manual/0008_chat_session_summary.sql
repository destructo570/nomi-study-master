-- Adds rolling-summary columns to chat_sessions for conversation compaction.
-- Apply manually:
--   psql "$DATABASE_URL" -f packages/db/drizzle/manual/0008_chat_session_summary.sql
-- Idempotent and safe to run twice.

BEGIN;

ALTER TABLE "chat_sessions"
  ADD COLUMN IF NOT EXISTS "summary"                   text,
  ADD COLUMN IF NOT EXISTS "summary_up_to_message_id"  text,
  ADD COLUMN IF NOT EXISTS "summary_updated_at"        timestamp with time zone;

COMMIT;
