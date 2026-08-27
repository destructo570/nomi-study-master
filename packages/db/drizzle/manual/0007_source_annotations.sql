-- Source annotations: per-source highlight/comment markers tied to a PDF page.
--
-- Apply with:
--   psql "$DATABASE_URL" -f packages/db/drizzle/manual/0007_source_annotations.sql
-- Idempotent and safe to run twice.

BEGIN;

CREATE TABLE IF NOT EXISTS "source_annotations" (
  "id" text PRIMARY KEY,
  "source_id" text NOT NULL REFERENCES "sources"("id") ON DELETE CASCADE,
  "notebook_id" text NOT NULL REFERENCES "notebooks"("id") ON DELETE CASCADE,
  "page" integer NOT NULL,
  "color" text NOT NULL DEFAULT 'yellow',
  "quoted_text" text NOT NULL DEFAULT '',
  "comment" text,
  "rects" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "source_annotations_source_idx"
  ON "source_annotations" ("source_id");

COMMIT;
