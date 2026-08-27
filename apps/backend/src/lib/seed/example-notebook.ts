import { and, eq, asc } from "drizzle-orm"
import { nanoid } from "nanoid"

import { db } from "@workspace/db"
import {
  flashcards,
  mindmaps,
  notebooks,
  podcasts,
  quizzes,
  shelves,
  sourceChunks,
  sources,
  summaries,
} from "@workspace/db/schema"

// The notebook we clone for every new sign-up. Owned by the founder account;
// rows here are the canonical "demo" content — sources, embeddings, summary,
// flashcards, quizzes, mindmap, and the rendered podcast (R2 audio + script).
//
// Cloned rows reuse R2 storage keys instead of copying objects — multiple
// notebooks pointing at the same S3 object is fine because the bytes are
// served via on-demand presigned URLs gated by row ownership.
export const EXAMPLE_NOTEBOOK_ID = "9o2cmp9Z"

const DEFAULT_SHELF_NAME = "Inbox"

/**
 * Find-or-create the user's default shelf. Mirrors the client-side
 * `useEnsureDefaultShelf` pattern but server-side, so we have a shelf to
 * drop the seed notebook onto before the user has clicked anything.
 */
async function ensureDefaultShelf(userId: string): Promise<string> {
  const [existing] = await db
    .select({ id: shelves.id })
    .from(shelves)
    .where(eq(shelves.userId, userId))
    .orderBy(asc(shelves.createdAt))
    .limit(1)
  if (existing) return existing.id
  const id = nanoid(8)
  await db.insert(shelves).values({ id, userId, name: DEFAULT_SHELF_NAME })
  return id
}

/**
 * Clone the demo notebook + every child artifact into `userId`'s account.
 * Idempotent: if a notebook with the seed ID has already been cloned for
 * this user (detected via a deterministic title marker on the row), skip.
 *
 * Failures are caught by the caller — sign-up must succeed even if the seed
 * step doesn't (e.g. demo notebook missing in a fresh dev DB).
 */
export async function seedExampleNotebook(userId: string): Promise<void> {
  const [sourceNotebook] = await db
    .select()
    .from(notebooks)
    .where(eq(notebooks.id, EXAMPLE_NOTEBOOK_ID))
    .limit(1)
  if (!sourceNotebook) {
    console.warn(
      `[seed] example notebook ${EXAMPLE_NOTEBOOK_ID} not found; skipping seed for user ${userId}`,
    )
    return
  }

  const shelfId = await ensureDefaultShelf(userId)

  // Idempotency guard: don't double-seed if a prior attempt succeeded.
  const [already] = await db
    .select({ id: notebooks.id })
    .from(notebooks)
    .where(
      and(eq(notebooks.userId, userId), eq(notebooks.title, sourceNotebook.title)),
    )
    .limit(1)
  if (already) return

  const newNotebookId = nanoid(8)

  await db.transaction(async (tx) => {
    // 1. The notebook itself.
    await tx.insert(notebooks).values({
      id: newNotebookId,
      shelfId,
      userId,
      title: sourceNotebook.title,
      icon: sourceNotebook.icon,
      cover: sourceNotebook.cover,
      tutorPreset: sourceNotebook.tutorPreset,
      customPrompt: sourceNotebook.customPrompt,
      language: sourceNotebook.language,
      notes: sourceNotebook.notes,
    })

    // 2. Sources. Track old->new source ids so we can rewrite source_chunks.
    const sourceRows = await tx
      .select()
      .from(sources)
      .where(eq(sources.notebookId, EXAMPLE_NOTEBOOK_ID))
    const sourceIdMap = new Map<string, string>()
    for (const s of sourceRows) {
      const newId = nanoid(8)
      sourceIdMap.set(s.id, newId)
      await tx.insert(sources).values({
        id: newId,
        notebookId: newNotebookId,
        type: s.type,
        title: s.title,
        content: s.content,
        mimeType: s.mimeType,
        fileName: s.fileName,
        fileSizeBytes: s.fileSizeBytes,
        // R2 keys shared across cloned notebooks. See note at top of file.
        storageKey: s.storageKey,
        sourceUrl: s.sourceUrl,
        status: s.status,
        extractedText: s.extractedText,
        translations: s.translations,
        errorMessage: s.errorMessage,
        processedAt: s.processedAt,
        indexedAt: s.indexedAt,
        indexError: s.indexError,
      })
    }

    // 3. Source chunks (embeddings). Vectors are deterministic for a given
    //    text, so reusing them is correct, not just convenient.
    const chunkRows = await tx
      .select()
      .from(sourceChunks)
      .where(eq(sourceChunks.notebookId, EXAMPLE_NOTEBOOK_ID))
    for (const ch of chunkRows) {
      const newSourceId = sourceIdMap.get(ch.sourceId)
      if (!newSourceId) continue
      await tx.insert(sourceChunks).values({
        id: nanoid(12),
        sourceId: newSourceId,
        notebookId: newNotebookId,
        page: ch.page,
        ord: ch.ord,
        text: ch.text,
        tokenCount: ch.tokenCount,
        embedding: ch.embedding,
        contentHash: ch.contentHash,
      })
    }

    // 4. Pre-computed AI artifacts. Same shape on both sides; just rewrite
    //    notebook_id and mint new ids.
    const summaryRows = await tx
      .select()
      .from(summaries)
      .where(eq(summaries.notebookId, EXAMPLE_NOTEBOOK_ID))
    for (const r of summaryRows) {
      await tx.insert(summaries).values({
        id: nanoid(8),
        notebookId: newNotebookId,
        depth: r.depth,
        prompt: r.prompt,
        markdown: r.markdown,
        language: r.language,
      })
    }

    const flashcardRows = await tx
      .select()
      .from(flashcards)
      .where(eq(flashcards.notebookId, EXAMPLE_NOTEBOOK_ID))
    for (const r of flashcardRows) {
      await tx.insert(flashcards).values({
        id: nanoid(8),
        notebookId: newNotebookId,
        question: r.question,
        answer: r.answer,
        hint: r.hint,
        order: r.order,
        language: r.language,
      })
    }

    const quizRows = await tx
      .select()
      .from(quizzes)
      .where(eq(quizzes.notebookId, EXAMPLE_NOTEBOOK_ID))
    for (const r of quizRows) {
      await tx.insert(quizzes).values({
        id: nanoid(8),
        notebookId: newNotebookId,
        question: r.question,
        options: r.options,
        correctAnswer: r.correctAnswer,
        order: r.order,
        language: r.language,
      })
    }

    const mindmapRows = await tx
      .select()
      .from(mindmaps)
      .where(eq(mindmaps.notebookId, EXAMPLE_NOTEBOOK_ID))
    for (const r of mindmapRows) {
      await tx.insert(mindmaps).values({
        id: nanoid(8),
        notebookId: newNotebookId,
        title: r.title,
        prompt: r.prompt,
        data: r.data,
        language: r.language,
      })
    }

    // 5. Podcast. One-per-notebook unique constraint on notebook_id keeps
    //    this naturally bounded; we only ever insert one row.
    const [podcast] = await tx
      .select()
      .from(podcasts)
      .where(eq(podcasts.notebookId, EXAMPLE_NOTEBOOK_ID))
      .limit(1)
    if (podcast) {
      await tx.insert(podcasts).values({
        id: nanoid(10),
        notebookId: newNotebookId,
        status: podcast.status,
        voicePrimary: podcast.voicePrimary,
        voiceSecondary: podcast.voiceSecondary,
        scriptJson: podcast.scriptJson,
        audioStorageKey: podcast.audioStorageKey,
        durationSeconds: podcast.durationSeconds,
        errorMessage: podcast.errorMessage,
      })
    }
  })
}
