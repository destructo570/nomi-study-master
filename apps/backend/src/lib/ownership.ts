import { and, eq } from "drizzle-orm"
import { HTTPException } from "hono/http-exception"

import { db } from "@workspace/db"
import {
  chapters,
  chatSessions,
  exams,
  flashcards,
  mindmaps,
  notebooks,
  quizzes,
  shelves,
  sourceAnnotations,
  sources,
  summaries,
} from "@workspace/db/schema"

function notFound(kind: string): HTTPException {
  // 404, not 403 — don't leak existence of other users' rows.
  return new HTTPException(404, { message: `${kind} not found` })
}

/**
 * Drizzle subquery that resolves to the IDs of every notebook owned by
 * `userId`. Use with `inArray(childTable.notebookId, ownedNotebookIds(userId))`
 * to make a child-table UPDATE/DELETE self-defending against IDOR — the
 * SQL is safe even if a `requireOwned…` check is later removed or skipped.
 */
export function ownedNotebookIds(userId: string) {
  return db
    .select({ id: notebooks.id })
    .from(notebooks)
    .where(eq(notebooks.userId, userId))
}

export async function requireOwnedShelf(userId: string, shelfId: string) {
  const [row] = await db
    .select()
    .from(shelves)
    .where(and(eq(shelves.id, shelfId), eq(shelves.userId, userId)))
    .limit(1)
  if (!row) throw notFound("Shelf")
  return row
}

export async function requireOwnedNotebook(userId: string, notebookId: string) {
  const [row] = await db
    .select()
    .from(notebooks)
    .where(and(eq(notebooks.id, notebookId), eq(notebooks.userId, userId)))
    .limit(1)
  if (!row) throw notFound("Notebook")
  return row
}

export async function requireOwnedSource(userId: string, sourceId: string) {
  const [row] = await db
    .select({ s: sources })
    .from(sources)
    .innerJoin(notebooks, eq(notebooks.id, sources.notebookId))
    .where(and(eq(sources.id, sourceId), eq(notebooks.userId, userId)))
    .limit(1)
  if (!row) throw notFound("Source")
  return row.s
}

export async function requireOwnedSourceInNotebook(
  userId: string,
  sourceId: string,
  notebookId: string,
) {
  const [row] = await db
    .select({ s: sources })
    .from(sources)
    .innerJoin(notebooks, eq(notebooks.id, sources.notebookId))
    .where(
      and(
        eq(sources.id, sourceId),
        eq(sources.notebookId, notebookId),
        eq(notebooks.userId, userId),
      ),
    )
    .limit(1)
  if (!row) throw notFound("Source")
  return row.s
}

export async function requireOwnedChatSession(userId: string, sessionId: string) {
  const [row] = await db
    .select()
    .from(chatSessions)
    .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
    .limit(1)
  if (!row) throw notFound("Chat session")
  return row
}

export async function requireOwnedAnnotation(userId: string, annotationId: string) {
  const [row] = await db
    .select({ a: sourceAnnotations })
    .from(sourceAnnotations)
    .innerJoin(notebooks, eq(notebooks.id, sourceAnnotations.notebookId))
    .where(
      and(eq(sourceAnnotations.id, annotationId), eq(notebooks.userId, userId)),
    )
    .limit(1)
  if (!row) throw notFound("Annotation")
  return row.a
}

export async function requireOwnedFlashcard(userId: string, flashcardId: string) {
  const [row] = await db
    .select({ f: flashcards })
    .from(flashcards)
    .innerJoin(notebooks, eq(notebooks.id, flashcards.notebookId))
    .where(and(eq(flashcards.id, flashcardId), eq(notebooks.userId, userId)))
    .limit(1)
  if (!row) throw notFound("Flashcard")
  return row.f
}

export async function requireOwnedQuiz(userId: string, quizId: string) {
  const [row] = await db
    .select({ q: quizzes })
    .from(quizzes)
    .innerJoin(notebooks, eq(notebooks.id, quizzes.notebookId))
    .where(and(eq(quizzes.id, quizId), eq(notebooks.userId, userId)))
    .limit(1)
  if (!row) throw notFound("Quiz")
  return row.q
}

export async function requireOwnedMindmap(userId: string, mindmapId: string) {
  const [row] = await db
    .select({ m: mindmaps })
    .from(mindmaps)
    .innerJoin(notebooks, eq(notebooks.id, mindmaps.notebookId))
    .where(and(eq(mindmaps.id, mindmapId), eq(notebooks.userId, userId)))
    .limit(1)
  if (!row) throw notFound("Mindmap")
  return row.m
}

export async function requireOwnedChapter(userId: string, chapterId: string) {
  const [row] = await db
    .select({ c: chapters })
    .from(chapters)
    .innerJoin(notebooks, eq(notebooks.id, chapters.notebookId))
    .where(and(eq(chapters.id, chapterId), eq(notebooks.userId, userId)))
    .limit(1)
  if (!row) throw notFound("Chapter")
  return row.c
}

export async function requireOwnedExam(userId: string, examId: string) {
  const [row] = await db
    .select({ e: exams })
    .from(exams)
    .innerJoin(notebooks, eq(notebooks.id, exams.notebookId))
    .where(and(eq(exams.id, examId), eq(notebooks.userId, userId)))
    .limit(1)
  if (!row) throw notFound("Exam")
  return row.e
}

export async function requireOwnedSummary(userId: string, summaryId: string) {
  const [row] = await db
    .select({ s: summaries })
    .from(summaries)
    .innerJoin(notebooks, eq(notebooks.id, summaries.notebookId))
    .where(and(eq(summaries.id, summaryId), eq(notebooks.userId, userId)))
    .limit(1)
  if (!row) throw notFound("Summary")
  return row.s
}
