-- Subscription metadata for Dodo Payments. Keep `plan` ("free" | "pro") as the
-- entitlement gate the rest of the code reads from; these columns track which
-- billing tier the user is on and the upstream subscription state.
-- Apply manually:
--   psql "$DATABASE_URL" -f packages/db/drizzle/manual/0011_subscriptions.sql
-- Idempotent and safe to run twice.

BEGIN;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "dodo_customer_id" text,
  ADD COLUMN IF NOT EXISTS "dodo_subscription_id" text,
  ADD COLUMN IF NOT EXISTS "subscription_tier" text,
  ADD COLUMN IF NOT EXISTS "subscription_status" text,
  ADD COLUMN IF NOT EXISTS "subscription_current_period_end" timestamptz;

CREATE INDEX IF NOT EXISTS "users_dodo_subscription_idx"
  ON "users" ("dodo_subscription_id");

CREATE INDEX IF NOT EXISTS "users_dodo_customer_idx"
  ON "users" ("dodo_customer_id");

COMMIT;
