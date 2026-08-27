-- Adds chat sessions and links chat_messages to a session.
-- drizzle-kit's introspection crashes on this project's DB, so apply this file manually:
--   psql "$DATABASE_URL" -f packages/db/drizzle/manual/0001_chat_sessions.sql
-- Idempotent and safe to run twice.

BEGIN;

CREATE TABLE IF NOT EXISTS "chat_sessions" (
  "id"          text PRIMARY KEY NOT NULL,
  "notebook_id" text NOT NULL REFERENCES "notebooks"("id") ON DELETE CASCADE,
  "title"       text,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "chat_sessions_notebook_id_updated_at_idx"
  ON "chat_sessions" ("notebook_id", "updated_at" DESC);

-- Nothing writes to chat_messages yet, so we can safely wipe and reshape.
TRUNCATE TABLE "chat_messages";

ALTER TABLE "chat_messages" DROP COLUMN IF EXISTS "generated";

ALTER TABLE "chat_messages"
  ADD COLUMN IF NOT EXISTS "session_id" text NOT NULL
  REFERENCES "chat_sessions"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "chat_messages_session_id_created_at_idx"
  ON "chat_messages" ("session_id", "created_at" ASC);

COMMIT;
