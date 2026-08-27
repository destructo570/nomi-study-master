-- 0017_notebook_language.sql
-- Per-notebook override for AI generation language. NULL inherits the
-- creator's users.language. Set at notebook creation and read by every
-- generate route (summary/flashcards/quizzes/mindmap) as the default
-- when the request body does not specify a language explicitly.

ALTER TABLE notebooks
  ADD COLUMN IF NOT EXISTS language text;
