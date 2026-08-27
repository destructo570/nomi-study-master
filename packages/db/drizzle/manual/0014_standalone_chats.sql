-- Allow chat sessions and chat messages to exist without a notebook.
-- Used for the global "My Chats" experience invoked from the Home page.
--
-- Apply manually:
--   psql "$DATABASE_URL" -f packages/db/drizzle/manual/0014_standalone_chats.sql
-- Idempotent and safe to run twice.

BEGIN;

ALTER TABLE "chat_sessions"
  ADD COLUMN IF NOT EXISTS "user_id" text REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "chat_sessions"
  ALTER COLUMN "notebook_id" DROP NOT NULL;

ALTER TABLE "chat_messages"
  ALTER COLUMN "notebook_id" DROP NOT NULL;

-- Backfill user_id from the owning notebook for existing sessions so the
-- new column can be relied on after deploy.
UPDATE "chat_sessions" cs
SET "user_id" = nb."user_id"
FROM "notebooks" nb
WHERE cs."notebook_id" = nb."id"
  AND cs."user_id" IS NULL;

CREATE INDEX IF NOT EXISTS "chat_sessions_user_idx"
  ON "chat_sessions" ("user_id", "updated_at" DESC);

COMMIT;
