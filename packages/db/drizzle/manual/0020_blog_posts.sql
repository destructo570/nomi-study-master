-- 0020_blog_posts.sql
-- Public blog table. `content` is MDX-flavoured markdown rendered server-side
-- by the /blog/[slug] route. A row is "published" iff published_at IS NOT NULL
-- AND <= now() — drafts stay invisible by leaving published_at NULL.
--
-- Apply manually:
--   psql "$DATABASE_URL" -f packages/db/drizzle/manual/0020_blog_posts.sql
-- Idempotent and safe to run twice.

BEGIN;

CREATE TABLE IF NOT EXISTS "posts" (
  "id"               text PRIMARY KEY,
  "slug"             text NOT NULL UNIQUE,
  "title"            text NOT NULL,
  "description"      text NOT NULL,
  "content"          text NOT NULL,
  "cover_image"      text,
  "cover_alt"        text,
  "author"           text NOT NULL DEFAULT 'fennya team',
  "tags"             jsonb NOT NULL DEFAULT '[]'::jsonb,
  "reading_minutes"  integer NOT NULL DEFAULT 5,
  "published_at"     timestamptz,
  "created_at"       timestamptz NOT NULL DEFAULT now(),
  "updated_at"       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "posts_published_idx"
  ON "posts" ("published_at");

-- ── Seed example post ────────────────────────────────────────────────
-- Use ON CONFLICT (slug) DO NOTHING so re-running the migration is safe
-- but does not overwrite hand-edited content.

INSERT INTO "posts" (
  "id", "slug", "title", "description", "content",
  "cover_image", "cover_alt", "author", "tags",
  "reading_minutes", "published_at"
) VALUES (
  'post_ai_flashcards_2026',
  'how-to-make-flashcards-from-a-pdf-with-ai',
  'How to Make Flashcards from a PDF with AI (2026 Guide)',
  'Turn any PDF — lecture slides, textbooks, research papers — into spaced-repetition flashcards in under a minute. A step-by-step walkthrough plus the science of why active recall beats highlighting.',
  $MDX$
Highlighting a PDF feels productive. It is, statistically, one of the worst things you can do for retention. Decades of cognitive-science research — from Roediger and Karpicke's landmark 2006 study onward — keep returning the same verdict: **active recall** (forcing your brain to retrieve an answer) beats re-reading, highlighting, and summarising on every measurable axis.

The catch has always been that *making* good flashcards is slow. Pulling out the right question, writing a clean prompt, and keeping the deck tidy across hundreds of pages of slides eats more time than students have. So most people give up and go back to highlighting.

AI flashcard generators close that gap. In this guide we'll walk through how to turn a PDF into a study-ready deck in under a minute, what makes a "good" AI-generated card vs. a noisy one, and how to wire your new deck into a spaced-repetition routine that actually sticks.

## Why active recall outperforms re-reading

When you re-read a chapter, your brain recognises the material and you feel fluent — but recognition is not the same as recall. On the exam, you will not be re-reading; you'll be retrieving. So the closer your practice gets to retrieval, the better it transfers.

A 2013 meta-analysis by Dunlosky et al. ranked ten common study techniques and gave only two a "high utility" rating: **practice testing** and **distributed practice**. Both are exactly what a flashcard deck delivers — provided the cards are good.

### What a good flashcard looks like

- **Atomic.** One idea per card. If a card asks two things, split it.
- **Specific.** "What did Roediger find?" is bad. "In Roediger and Karpicke (2006), what study technique produced the largest gain on a one-week delayed test?" is good.
- **Cued by context.** A card should be answerable without needing the surrounding paragraph.
- **Reversible where it matters.** For vocabulary and definitions, generate the card in both directions.

This is the bar an AI generator has to hit to be useful — and the bar most generic LLM prompts miss.

## Step 1 — Upload your PDF

Drag the PDF into your study workspace. Most modern AI study tools (fennya included) handle:

- Lecture slide decks (PowerPoint exports)
- Textbook chapters
- Research papers
- Scanned class notes (with OCR)
- Long-form articles

If your PDF is image-only (a phone photo of a whiteboard, for example), make sure the tool runs OCR before generating cards. Otherwise the model is guessing from filenames.

## Step 2 — Let the AI extract the key claims

Behind the scenes, a good flashcard generator does three things in sequence:

1. **Chunks** the document into ~500-token passages.
2. **Identifies claims worth testing** — definitions, mechanisms, dates, formulas, cause/effect chains.
3. **Writes cards** with the surrounding context baked into the question so they stand alone.

What you want to avoid is a single-prompt "summarise this PDF into flashcards" call. That produces cards that are too long, too vague, and full of phrases like "according to the document". A purpose-built generator structures the pipeline instead.

## Step 3 — Edit, don't delete

Even with a good generator, expect to keep around 80% of cards as-is and rewrite the rest. Common edits:

- **Tighten the question.** Replace "Discuss the role of…" with "What is the role of…"
- **Cut the giveaways.** If the answer is in the question, rewrite.
- **Merge near-duplicates** the model produced from adjacent paragraphs.

Treat this pass as a study session in itself — you're already retrieving and consolidating as you edit.

## Step 4 — Wire the deck into spaced repetition

A flashcard you saw once is a flashcard you'll forget. Spaced repetition schedules each card so you see it just before you would have forgotten it, which is when the memory consolidation gain is largest. The classic algorithms — SM-2 in Anki, FSRS in newer tools — handle the scheduling for you.

Two rules of thumb:

- **Front-load the first week.** Most forgetting happens in the first 24–48 hours. Review aggressively then; the intervals stretch out fast.
- **Trust the algorithm on "hard" ratings.** If a card keeps coming up, the schedule is correct — the card is testing something you actually need to learn.

## Step 5 — Combine with practice questions

Flashcards are excellent for **declarative** knowledge — what something is, when it happened, how a formula reads. They are weaker for **procedural** knowledge — how to actually apply a method end-to-end. Pair the deck with quizzes and practice problems generated from the same PDF, and you cover both halves.

![Auto-generated multiple-choice quiz alongside a flashcard deck inside fennya](/images/feature-quizzes.png)

## A worked example

Take a 40-page chapter on cellular respiration. A good AI generator should produce roughly:

- **30–50 atomic cards** covering definitions (glycolysis, oxidative phosphorylation), key intermediates (NADH, FADH₂, ATP yields), and mechanism steps.
- **A short quiz** of 8–12 multiple-choice questions for procedural practice.
- **A summary** you can re-read the morning of the exam, *after* the deck has done the heavy lifting.

Spending 45 minutes once, then 10 minutes a day for two weeks, will outperform a single five-hour cram session by a comfortable margin. The research is consistent on this — what's changed is how cheap "spending 45 minutes once" has become.

## FAQ

### Is using AI to make flashcards considered cheating?

No. You're using a tool to prepare study materials — the cognitive work of retrieval and consolidation still happens in your head. The same question applies to using a textbook's pre-made review questions, which no one calls cheating.

### How many flashcards should I make per chapter?

Aim for one card per non-trivial claim, not one per sentence. For a typical textbook chapter that lands somewhere between 25 and 60 cards. More than that and you're testing trivia; fewer and you're skipping the kind of detail that exams probe.

### What if my PDF is in a language other than English?

A multilingual study tool can generate cards in the source language directly — there's no quality penalty, and it avoids the translation drift that happens when you make English cards from a Spanish lecture.

### Can I share a deck I generated with classmates?

Yes — most tools let you export to Anki (`.apkg`) or share a read-only link. Just be careful about copyrighted material; sharing a deck of your own questions is fine, sharing a verbatim re-export of a textbook is not.

## The short version

1. Upload the PDF.
2. Let a purpose-built generator produce atomic cards.
3. Spend 10 minutes editing the rough 20%.
4. Review on a spaced-repetition schedule for two weeks.
5. Pair with quizzes for procedural recall.

That's the entire workflow. The hard part used to be step two; it's now the cheapest step in the chain. The work that's left is the work that was always going to be yours — actually retrieving the material, again and again, until it sticks.

Ready to try it on your own PDF? [Start a free notebook on fennya](/signup) and have your first deck in under a minute.
$MDX$,
  '/images/feature-flashcards-3.png',
  'AI-generated flashcards from a PDF in the fennya study workspace',
  'fennya team',
  '["study","ai","flashcards","spaced-repetition"]'::jsonb,
  8,
  '2026-05-10T09:00:00Z'
)
ON CONFLICT (slug) DO NOTHING;

-- Backfill the cover for installs that ran an earlier version of this
-- migration before the cover columns were populated. Only touches rows
-- where the cover is still empty.
UPDATE "posts"
SET
  "cover_image" = '/images/feature-flashcards-3.png',
  "cover_alt"   = 'AI-generated flashcards from a PDF in the fennya study workspace'
WHERE "slug" = 'how-to-make-flashcards-from-a-pdf-with-ai'
  AND "cover_image" IS NULL;

COMMIT;
