-- Adds credit-pool tables that replace per-action quotas for the free tier.
--   user_credits             — current balance + lifetime stats per user.
--   credit_grants            — append-only ledger of every balance change.
--   credit_promo_submissions — TikTok / Reels submissions awaiting review.
-- Apply manually:
--   psql "$DATABASE_URL" -f packages/db/drizzle/manual/0012_user_credits.sql
-- Idempotent and safe to run twice.

BEGIN;

CREATE TABLE IF NOT EXISTS "user_credits" (
  "user_id"           text PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "balance"           integer NOT NULL DEFAULT 0,
  "lifetime_granted"  integer NOT NULL DEFAULT 0,
  "lifetime_consumed" integer NOT NULL DEFAULT 0,
  "updated_at"        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "credit_grants" (
  "id"             text PRIMARY KEY,
  "user_id"        text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "delta"          integer NOT NULL,
  "reason"         text NOT NULL,
  "source"         text NOT NULL,
  "metadata"       jsonb,
  "actor_user_id"  text REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at"     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "credit_grants_user_idx"
  ON "credit_grants" ("user_id", "created_at");

CREATE TABLE IF NOT EXISTS "credit_promo_submissions" (
  "id"                 text PRIMARY KEY,
  "user_id"            text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "platform"           text NOT NULL,
  "post_url"           text NOT NULL,
  "status"             text NOT NULL DEFAULT 'pending',
  "views_at_submit"    integer,
  "views_at_approval"  integer,
  "credits_awarded"    integer NOT NULL DEFAULT 0,
  "notes"              text,
  "submitted_at"       timestamptz NOT NULL DEFAULT now(),
  "reviewed_at"        timestamptz,
  "reviewed_by"        text REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "credit_promo_user_idx"
  ON "credit_promo_submissions" ("user_id", "submitted_at");
CREATE INDEX IF NOT EXISTS "credit_promo_status_idx"
  ON "credit_promo_submissions" ("status", "submitted_at");

COMMIT;
