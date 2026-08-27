-- 0023_misc.sql
-- Stores miscellaneous key-value configuration entries (discount codes, etc).
--
-- Apply:
--   psql "$DATABASE_URL" -f packages/db/drizzle/manual/0023_misc.sql
-- Idempotent and safe to run twice.

BEGIN;

CREATE TABLE IF NOT EXISTS "misc" (
  "id"         text PRIMARY KEY,
  "type"       text NOT NULL,
  "value"      jsonb NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

COMMIT;
