-- 0019_source_translations.sql
-- Per-source translations for text-bearing sources (text/youtube/article).
-- Shape: { [languageCode]: string } where the value is the translated
-- extracted text. PDFs are excluded from the translate flow at the
-- application layer (the route refuses to translate file/pdf sources),
-- so this column will simply stay '{}' for them.
--
-- The original source.extractedText is never overwritten — the dropdown
-- in the UI swaps which text the user sees but the canonical row stays
-- in whatever language the ingestion produced.

ALTER TABLE sources
  ADD COLUMN IF NOT EXISTS translations jsonb NOT NULL DEFAULT '{}'::jsonb;
