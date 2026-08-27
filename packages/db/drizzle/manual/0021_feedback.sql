-- 0021_feedback.sql
-- User feedback submissions from the sidebar Feedback dialog.
--
-- Apply manually:
--   psql "$DATABASE_URL" -f packages/db/drizzle/manual/0021_feedback.sql
-- Idempotent and safe to run twice.

BEGIN;

CREATE TABLE IF NOT EXISTS "feedback" (
  "id"          text PRIMARY KEY,
  "user_id"     text REFERENCES "users"("id") ON DELETE SET NULL,
  "message"     text NOT NULL,
  "user_agent"  text,
  "created_at"  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "feedback_user_idx"
  ON "feedback" ("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "feedback_created_idx"
  ON "feedback" ("created_at");

COMMIT;
