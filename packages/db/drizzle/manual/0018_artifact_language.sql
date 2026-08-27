-- 0018_artifact_language.sql
-- Per-artifact language tag. Each notebook can now hold multiple
-- translations of the same artifact (summary, flashcards, quizzes,
-- mindmap) and the UI switches between them via a language dropdown.
-- Existing rows are backfilled from the parent notebook's language (or
-- the owner's profile language) so the previous behaviour where every
-- artifact was implicitly in the notebook's language is preserved.

ALTER TABLE summaries  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';
ALTER TABLE quizzes    ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';
ALTER TABLE mindmaps   ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';

-- Backfill rows that were created before the column existed (they
-- defaulted to 'en') to the notebook's actual language so language
-- dropdowns don't mislabel old content.
UPDATE summaries s
   SET language = COALESCE(n.language, u.language, 'en')
  FROM notebooks n
  JOIN users u ON u.id = n.user_id
 WHERE s.notebook_id = n.id
   AND s.language = 'en';

UPDATE flashcards f
   SET language = COALESCE(n.language, u.language, 'en')
  FROM notebooks n
  JOIN users u ON u.id = n.user_id
 WHERE f.notebook_id = n.id
   AND f.language = 'en';

UPDATE quizzes q
   SET language = COALESCE(n.language, u.language, 'en')
  FROM notebooks n
  JOIN users u ON u.id = n.user_id
 WHERE q.notebook_id = n.id
   AND q.language = 'en';

UPDATE mindmaps m
   SET language = COALESCE(n.language, u.language, 'en')
  FROM notebooks n
  JOIN users u ON u.id = n.user_id
 WHERE m.notebook_id = n.id
   AND m.language = 'en';

-- Speed up the (notebook_id, language) lookup the new read/translate
-- paths rely on. No uniqueness constraint: pre-migration rows may have
-- multiple summaries/mindmaps per notebook from earlier development, and
-- single-row-per-(notebook, language) is enforced in the route handlers
-- now rather than at the schema level.
CREATE INDEX IF NOT EXISTS summaries_notebook_language_idx
  ON summaries (notebook_id, language);

CREATE INDEX IF NOT EXISTS flashcards_notebook_language_idx
  ON flashcards (notebook_id, language);

CREATE INDEX IF NOT EXISTS quizzes_notebook_language_idx
  ON quizzes (notebook_id, language);

CREATE INDEX IF NOT EXISTS mindmaps_notebook_language_idx
  ON mindmaps (notebook_id, language);
