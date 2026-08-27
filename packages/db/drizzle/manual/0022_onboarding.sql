-- 0022_onboarding.sql
-- Stores user onboarding questionnaire answers for personalization.
--
-- Apply:
--   psql "$DATABASE_URL" -f packages/db/drizzle/manual/0022_onboarding.sql
-- Idempotent and safe to run twice.

BEGIN;

CREATE TABLE IF NOT EXISTS "onboarding_answers" (
  "user_id"     text PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "answers"     jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at"  timestamptz NOT NULL DEFAULT now(),
  "updated_at"  timestamptz NOT NULL DEFAULT now()
);

COMMIT;
