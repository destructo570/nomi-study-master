-- Adds a role column to users for admin gating (currently used by /llm-test).
-- Apply manually:
--   psql "$DATABASE_URL" -f packages/db/drizzle/manual/0009_user_role.sql
-- Idempotent and safe to run twice.

BEGIN;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "role" text NOT NULL DEFAULT 'user';

COMMIT;
