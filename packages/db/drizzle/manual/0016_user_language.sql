-- 0016_user_language.sql
-- Adds a per-user default content language. The picker in the UI is bound to
-- this column, and every AI generate dialog pre-selects it. ISO 639-1 code.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';
