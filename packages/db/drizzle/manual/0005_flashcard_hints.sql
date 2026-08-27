-- Flashcard hints: add nullable hint column for spaced-repetition recall nudges.
--
-- Apply with:
--   psql "$DATABASE_URL" -f packages/db/drizzle/manual/0005_flashcard_hints.sql
-- Idempotent and safe to run twice.

BEGIN;

ALTER TABLE "flashcards"
  ADD COLUMN IF NOT EXISTS "hint" text;

COMMIT;
