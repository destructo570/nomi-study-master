-- 0024_blog_faq_howto.sql
-- Adds optional structured `faq` and `how_to` JSONB columns to `posts` so blog
-- posts can ship FAQPage / HowTo JSON-LD for answer engines (AEO). Both columns
-- are nullable; posts without them simply omit the extra schema.
--
-- Apply manually:
--   psql "$DATABASE_URL" -f packages/db/drizzle/manual/0024_blog_faq_howto.sql
-- Idempotent and safe to run twice (UPDATEs re-set the same values).

BEGIN;

ALTER TABLE "posts"
  ADD COLUMN IF NOT EXISTS "faq"    jsonb,
  ADD COLUMN IF NOT EXISTS "how_to" jsonb;

-- Flashcards guide: 4-question FAQ + 5-step HowTo, both lifted from the post's
-- existing body content.
UPDATE "posts"
SET
  "faq" = $json$[
    {"q":"Is using AI to make flashcards considered cheating?","a":"No. You're using a tool to prepare study materials — the cognitive work of retrieval and consolidation still happens in your head. The same question applies to using a textbook's pre-made review questions, which no one calls cheating."},
    {"q":"How many flashcards should I make per chapter?","a":"Aim for one card per non-trivial claim, not one per sentence. For a typical textbook chapter that lands somewhere between 25 and 60 cards. More than that and you're testing trivia; fewer and you're skipping the kind of detail that exams probe."},
    {"q":"What if my PDF is in a language other than English?","a":"A multilingual study tool can generate cards in the source language directly — there's no quality penalty, and it avoids the translation drift that happens when you make English cards from a Spanish lecture."},
    {"q":"Can I share a deck I generated with classmates?","a":"Yes — most tools let you export to Anki (.apkg) or share a read-only link. Just be careful about copyrighted material; sharing a deck of your own questions is fine, sharing a verbatim re-export of a textbook is not."}
  ]$json$::jsonb,
  "how_to" = $json$
    {
      "name": "How to Make Flashcards from a PDF with AI",
      "steps": [
        "Upload your PDF — Drag the PDF into your study workspace. Modern AI study tools handle lecture slide decks, textbook chapters, research papers, scanned class notes (with OCR), and long-form articles. If your PDF is image-only, make sure the tool runs OCR before generating cards.",
        "Let the AI extract the key claims — A good flashcard generator chunks the document into ~500-token passages, identifies claims worth testing (definitions, mechanisms, dates, formulas, cause/effect chains), and writes cards with surrounding context baked into the question so they stand alone.",
        "Edit, don't delete — Expect to keep around 80% of cards as-is and rewrite the rest. Tighten questions, cut giveaways, and merge near-duplicates the model produced from adjacent paragraphs. Treat this pass as a study session in itself.",
        "Wire the deck into spaced repetition — Spaced repetition schedules each card so you see it just before you would have forgotten it, when memory consolidation gain is largest. Front-load the first week (most forgetting happens in 24-48 hours) and trust the algorithm on hard ratings.",
        "Combine with practice questions — Flashcards are excellent for declarative knowledge but weaker for procedural knowledge. Pair the deck with quizzes and practice problems generated from the same PDF to cover both halves."
      ]
    }
  $json$::jsonb
WHERE "slug" = 'how-to-make-flashcards-from-a-pdf-with-ai';

-- Best AI Study Tools 2026: 5-question FAQ lifted from the post's FAQ section.
UPDATE "posts"
SET
  "faq" = $json$[
    {"q":"What is the best AI study tool overall?","a":"The answer depends on your goals. Students looking for a complete study workflow often prefer Nomi, while those focused on memorization may prefer Anki or Quizlet."},
    {"q":"Are AI study tools worth using?","a":"When used correctly, AI study tools can save time, improve organization, and make learning more interactive."},
    {"q":"Which AI tool is best for research?","a":"NotebookLM and Perplexity are among the strongest options for research and source-based learning."},
    {"q":"Which AI tool is best for exam preparation?","a":"Platforms that support quizzes, flashcards, and practice tests generally provide the most value when preparing for exams."},
    {"q":"Can I combine multiple tools?","a":"Yes. Most students benefit from using one primary study platform and one specialized research or tutoring tool."}
  ]$json$::jsonb
WHERE "slug" = 'best-ai-study-tools-2026';

COMMIT;
