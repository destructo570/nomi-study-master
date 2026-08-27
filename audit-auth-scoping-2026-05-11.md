# Auth-scoping audit — backend routes

Date: 2026-05-11
Scope: every authenticated handler in `apps/backend/src/routes/*.ts`
Trigger: verifying commit `b2a54a6` ("scope every user-owned route by authenticated userId")

## Verdict

**No IDOR vulnerabilities found.** Every authenticated route either:
1. Reads `userId` from the session and includes it in the DB `WHERE` clause directly, or
2. Calls one of the `requireOwnedX` helpers in `lib/ownership.ts` before touching the resource.

The `b2a54a6` fix appears comprehensive. Safe to charge real users from a cross-account-leak standpoint.

That said, there are ~10 "defense-in-depth" gaps and 3 adjacent issues worth fixing before launch. None are exploitable today; all become exploitable if a future refactor moves or removes a single line.

## Method

1. Read `middleware/auth.ts` to confirm the auth gate is correct.
2. Read `lib/ownership.ts` to confirm helper semantics.
3. Read every route file end to end: `notebooks`, `shelves`, `sources`, `chapters`, `flashcards`, `quizzes`, `mindmaps`, `exams`, `chat-sessions`, `archive`, `me`, `generate-course`, `billing`, `admin`, `llm-test`.
4. For each handler, traced the flow from `c.get("userId")` to every DB read/write.

## What's solid

- **`middleware/auth.ts`**. Only `/health`, `/api/auth/*`, and `/api/billing/webhook` are public. Every other route gets `userId` set from the Better Auth session before the handler runs. `/api/admin/*` and `/api/llm-test/*` additionally require `requireAdmin`.
- **`lib/ownership.ts`**. 12 helpers — one per user-owned resource type (Shelf, Notebook, Source, SourceInNotebook, ChatSession, Annotation, Flashcard, Quiz, Mindmap, Chapter, Exam, Summary). Each helper joins to `notebooks.userId` (or filters `userId` directly), and **returns 404, not 403**, so the existence of other users' rows isn't leaked.
- **`archive.ts`**. Every shelf/notebook/source query in the archive flow includes `eq(notebooks.userId, userId)` or `eq(shelves.userId, userId)`. Even the cascading "empty trash" transaction filters every layer by user.
- **`billing.ts`**. `/subscription` and `/checkout` filter `users.id` by `c.get("userId")`. The webhook resolves the target user from signed Dodo payload (subscription_id → customer_id → metadata.user_id), never trusts a caller-supplied identity.
- **Workers** (`file-process`, `source-embed`, `url-ingest`). Jobs are only enqueued by route handlers *after* ownership has been verified at the API layer. No way for a user to enqueue a job for a source they don't own.
- **RAG search** (`lib/rag/search.ts`). `searchChunks(notebookId, …)` filters by notebookId, and every caller has already verified ownership of that notebook.

## Defense-in-depth gaps (not exploitable today)

In several places, ownership is verified by `requireOwnedX(userId, id)` and then the actual UPDATE/DELETE/INSERT runs as `WHERE id = $id` only — without re-asserting `userId`. Today this is safe because the helper just ran. Tomorrow, if someone refactors the helper away or moves it behind a conditional, the SQL silently becomes IDOR.

The fix is the same in every case: add `eq(table.userId, userId)` (or join through to `notebooks.userId`) to the second query's WHERE clause. Cheap, makes each query self-defending.

| File | Lines | Pattern |
|---|---|---|
| `routes/notebooks.ts` | 484, 495, 533 | UPDATE notebooks SET … WHERE id = $id (after requireOwnedNotebook) |
| `routes/notebooks.ts` | 715, 769, 778 | UPDATE sources / DELETE source_chunks WHERE id = $id (after requireOwnedSourceInNotebook) |
| `routes/sources.ts` | 32, 44, 107, 116 | UPDATE/DELETE sources or sourceAnnotations WHERE id = $id (after requireOwnedSource/Annotation) |
| `routes/chapters.ts` | 32, 45 | UPDATE/DELETE chapters WHERE id = $id (after requireOwnedChapter) |
| `routes/flashcards.ts` | 38, 47 | UPDATE/DELETE flashcards WHERE id = $id (after requireOwnedFlashcard) |
| `routes/quizzes.ts` | 44, 53 | UPDATE/DELETE quizzes WHERE id = $id (after requireOwnedQuiz) |
| `routes/mindmaps.ts` | 53, 62 | UPDATE/DELETE mindmaps WHERE id = $id (after requireOwnedMindmap) |
| `routes/exams.ts` | 15 | DELETE exams WHERE id = $id (after requireOwnedExam) |
| `routes/chat-sessions.ts` | 92 | DELETE chatSessions WHERE id = $id (after requireOwnedChatSession) |
| `routes/chat-sessions.ts` | 128–135 | SELECT by id then check userId in JS — safer to include userId in WHERE |
| `routes/archive.ts` | 163, 216 | UPDATE/DELETE sources WHERE id = $id (after explicit ownership SELECT) |

None of these are exploitable as-is. Pre-launch I'd batch-fix them — it's literally an `and(...)` change per query and ~30 minutes of work. Lower priority than the adjacent issues below.

## Adjacent issues I noticed while reading

These aren't auth-scoping bugs but they're in the same files and should be fixed before launch:

### 1. Webhook idempotency (billing.ts:130–286) — medium concern

The Dodo webhook handler runs `db.update(users)` and `revokeCredits()` unconditionally on every matching event. There's no `webhook_events` table tracking processed event IDs.

- DB plan/status updates are effectively idempotent (same final state on retry).
- `revokeCredits` may write a ledger row each time. If Dodo retries `payment.refunded`, you get duplicate `subscription_refunded` ledger entries. Not a security bug, but it'll confuse any future "why was this user downgraded twice" investigation.
- Standard Webhooks library handles signature + timestamp; replay window is enforced there. So a malicious replay isn't the worry — it's Dodo's own retry behavior on transient 5xx.

**Fix**: add a `processed_webhook_events(event_id, processed_at)` table; check + insert at the top of the handler; bail with `ok: true, ignored: "duplicate"` if already seen.

### 2. Partial-refund handling (billing.ts:221–237) — high concern

```ts
if (isRefundEvent) {
  await db.update(users).set({ plan: "free", … })
  await revokeCredits({ … })
}
```

Any refund event — including a partial refund — wipes the entire Pro subscription and revokes all credits. If a user disputes ₹100 of a ₹999 charge and you partially refund, you lose them as a Pro customer entirely.

**Fix**: check the refund payload for `is_partial` / refunded amount vs original amount. Only downgrade on full refund. Worth confirming what Dodo actually sends in the `payment.refunded` payload.

### 3. Chat debug context dump (notebooks.ts:1330–1397) — privacy concern

Every chat request writes the full retrieved context, system prompt, and message history to `debug/chat-context/<timestamp>_<notebookId>_<sessionId>.txt`. This is fine in dev but **runs unconditionally in production** — every user message is persisted to the server filesystem indefinitely.

User content is the most sensitive data on this product per the privacy policy. Logging it to disk forever, with no rotation, contradicts the stance you took in `app/privacy/page.tsx`.

**Fix**: gate the call (`if (process.env.NODE_ENV !== "production") void dumpChatContextToFile(...)`) and add a periodic cleanup of any existing dumps in prod.

## Recommended action order

1. **Today**: gate the chat-context disk dump on non-prod (issue #3) — one-line fix, biggest blast radius.
2. **Before charging real cards**: webhook idempotency table (issue #1) + partial-refund check (issue #2).
3. **Pre-launch hardening pass**: bulk-add `userId` to the 30-odd post-ownership-check WHERE clauses (the table above). Mechanical change, makes the audit checks self-defending against future refactors.

The IDOR audit itself: green light.
