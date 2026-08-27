import type {
  Annotation,
  AnnotationColor,
  AnnotationRect,
  Chapter,
  ChatMessage,
  ChatSessionSummary,
  Exam,
  Flashcard,
  KokoroVoiceId,
  Me,
  Mindmap,
  MindmapData,
  Notebook,
  NotebookDoc,
  Plan,
  Podcast,
  PodcastScriptTurn,
  PodcastStatus,
  Quiz,
  Shelf,
  Source,
  SourceStatus,
  SourceType,
  SubscriptionStatus,
  SubscriptionTier,
  Summary,
  SummaryDepth,
  TutorPreset,
} from "@workspace/types"
import { normalizeLanguage } from "@workspace/types/language"

type ShelfRow = {
  id: string
  userId: string | null
  name: string
  archivedAt: Date | null
  createdAt: Date
}

type NotebookRow = {
  id: string
  shelfId: string
  userId: string | null
  title: string
  icon: string | null
  cover: string | null
  tutorPreset: string | null
  customPrompt: string | null
  language: string | null
  notes: unknown
  archivedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

type ChapterRow = {
  id: string
  notebookId: string
  order: number
  title: string
  markdown: string
  createdAt: Date
  updatedAt: Date
}

type SourceRow = {
  id: string
  notebookId: string
  type: string
  title: string
  content: string
  mimeType: string | null
  fileName: string | null
  fileSizeBytes: number | null
  storageKey: string | null
  sourceUrl: string | null
  status: string
  extractedText: string | null
  translations: unknown
  errorMessage: string | null
  processedAt: Date | null
  archivedAt: Date | null
  createdAt: Date
}

type ChatRow = {
  id: string
  sessionId: string
  notebookId: string | null
  role: string
  content: string
  createdAt: Date
}

type ChatSessionRow = {
  id: string
  notebookId: string | null
  title: string | null
  createdAt: Date
  updatedAt: Date
}

type FlashcardRow = {
  id: string
  notebookId: string
  question: string
  answer: string
  hint: string | null
  order: number
  language: string
  createdAt: Date
}

type QuizRow = {
  id: string
  notebookId: string
  question: string
  options: string[]
  correctAnswer: string
  order: number
  language: string
  createdAt: Date
}

type ExamRow = {
  id: string
  notebookId: string
  question: string
  answer: string
  explanation: string | null
  order: number
  createdAt: Date
}

type NotebookDocRow = {
  notebookId: string
  content: unknown
  updatedAt: Date
}

type MindmapRow = {
  id: string
  notebookId: string
  title: string
  prompt: string | null
  data: unknown
  language: string
  createdAt: Date
  updatedAt: Date
}

type SummaryRow = {
  id: string
  notebookId: string
  depth: string
  prompt: string | null
  markdown: string
  language: string
  createdAt: Date
  updatedAt: Date
}

type UserRow = {
  id: string
  email: string
  name: string | null
  image: string | null
  plan: string
  role: string
  language: string
  subscriptionTier: string | null
  subscriptionStatus: string | null
  subscriptionCurrentPeriodEnd: Date | null
  createdAt: Date
}

const SUBSCRIPTION_TIERS = new Set<string>(["weekly", "monthly", "yearly"])
const SUBSCRIPTION_STATUSES = new Set<string>([
  "active",
  "on_hold",
  "cancelled",
  "expired",
  "failed",
  "pending",
])

export function toShelf(r: ShelfRow): Shelf {
  return {
    id: r.id,
    name: r.name,
    archivedAt: r.archivedAt ? r.archivedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }
}

export function toNotebook(r: NotebookRow): Notebook {
  return {
    id: r.id,
    shelfId: r.shelfId,
    title: r.title,
    icon: r.icon ?? undefined,
    cover: r.cover ?? undefined,
    notes: (r.notes as NotebookDoc | null) ?? null,
    archivedAt: r.archivedAt ? r.archivedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    tutorPreset: (r.tutorPreset ?? undefined) as TutorPreset | undefined,
    customPrompt: r.customPrompt ?? undefined,
    language: r.language ?? null,
  }
}

export function toChapter(r: ChapterRow): Chapter {
  return {
    id: r.id,
    notebookId: r.notebookId,
    order: r.order,
    title: r.title,
    markdown: r.markdown,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

export function toSource(r: SourceRow): Source {
  const rawTranslations =
    r.translations && typeof r.translations === "object" && !Array.isArray(r.translations)
      ? (r.translations as Record<string, unknown>)
      : {}
  const translations: Record<string, string> = {}
  for (const [k, v] of Object.entries(rawTranslations)) {
    if (typeof v === "string" && v.length > 0) translations[k] = v
  }
  return {
    id: r.id,
    notebookId: r.notebookId,
    type: r.type as SourceType,
    title: r.title,
    content: r.content,
    mimeType: r.mimeType,
    fileName: r.fileName,
    fileSizeBytes: r.fileSizeBytes,
    sourceUrl: r.sourceUrl,
    status: r.status as SourceStatus,
    errorMessage: r.errorMessage,
    processedAt: r.processedAt ? r.processedAt.toISOString() : null,
    archivedAt: r.archivedAt ? r.archivedAt.toISOString() : null,
    translations,
    createdAt: r.createdAt.toISOString(),
  }
}

export function toChat(r: ChatRow): ChatMessage {
  return {
    id: r.id,
    role: r.role as ChatMessage["role"],
    content: r.content,
    createdAt: r.createdAt.toISOString(),
  }
}

export function toChatSession(r: ChatSessionRow): ChatSessionSummary {
  return {
    id: r.id,
    title: r.title,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

export function toFlashcard(r: FlashcardRow): Flashcard {
  return {
    id: r.id,
    notebookId: r.notebookId,
    question: r.question,
    answer: r.answer,
    hint: r.hint,
    order: r.order,
    language: r.language,
    createdAt: r.createdAt.toISOString(),
  }
}

export function toQuiz(r: QuizRow): Quiz {
  return {
    id: r.id,
    notebookId: r.notebookId,
    question: r.question,
    options: r.options,
    correctAnswer: r.correctAnswer,
    order: r.order,
    language: r.language,
    createdAt: r.createdAt.toISOString(),
  }
}

export function toExam(r: ExamRow): Exam {
  return {
    id: r.id,
    notebookId: r.notebookId,
    question: r.question,
    answer: r.answer,
    explanation: r.explanation,
    order: r.order,
    createdAt: r.createdAt.toISOString(),
  }
}

export function toDoc(r: NotebookDocRow): NotebookDoc {
  return r.content as NotebookDoc
}

export function toMindmap(r: MindmapRow): Mindmap {
  const raw = (r.data ?? { nodes: [], edges: [] }) as MindmapData
  return {
    id: r.id,
    notebookId: r.notebookId,
    title: r.title,
    prompt: r.prompt,
    data: {
      nodes: Array.isArray(raw.nodes) ? raw.nodes : [],
      edges: Array.isArray(raw.edges) ? raw.edges : [],
    },
    language: r.language,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

type PodcastRow = {
  id: string
  notebookId: string
  status: string
  voicePrimary: string
  voiceSecondary: string
  scriptJson: unknown
  audioStorageKey: string | null
  durationSeconds: number | null
  errorMessage: string | null
  createdAt: Date
  updatedAt: Date
}

const PODCAST_STATUSES = new Set<string>([
  "pending",
  "generating",
  "ready",
  "failed",
])

export function toPodcast(r: PodcastRow): Podcast {
  const rawScript = Array.isArray(r.scriptJson) ? r.scriptJson : null
  const script: PodcastScriptTurn[] | null = rawScript
    ? rawScript
        .map((raw) => {
          const v = raw as Partial<PodcastScriptTurn>
          if (
            (v.speaker === "host" || v.speaker === "guest") &&
            typeof v.text === "string"
          ) {
            return { speaker: v.speaker, text: v.text }
          }
          return null
        })
        .filter((t): t is PodcastScriptTurn => t !== null)
    : null
  return {
    id: r.id,
    notebookId: r.notebookId,
    status: (PODCAST_STATUSES.has(r.status) ? r.status : "pending") as PodcastStatus,
    voicePrimary: r.voicePrimary as KokoroVoiceId,
    voiceSecondary: r.voiceSecondary as KokoroVoiceId,
    script,
    durationSeconds: r.durationSeconds,
    errorMessage: r.errorMessage,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

export function toSummary(r: SummaryRow): Summary {
  return {
    id: r.id,
    notebookId: r.notebookId,
    depth: r.depth as SummaryDepth,
    prompt: r.prompt,
    markdown: r.markdown,
    language: r.language,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

type AnnotationRow = {
  id: string
  sourceId: string
  notebookId: string
  page: number
  color: string
  quotedText: string
  comment: string | null
  rects: unknown
  createdAt: Date
  updatedAt: Date
}

export function toAnnotation(r: AnnotationRow): Annotation {
  const rawRects = Array.isArray(r.rects) ? r.rects : []
  const rects: AnnotationRect[] = rawRects
    .map((raw) => {
      const v = raw as Partial<AnnotationRect>
      return {
        x: Number(v.x ?? 0),
        y: Number(v.y ?? 0),
        w: Number(v.w ?? 0),
        h: Number(v.h ?? 0),
      }
    })
    .filter((rect) => rect.w > 0 && rect.h > 0)
  return {
    id: r.id,
    sourceId: r.sourceId,
    notebookId: r.notebookId,
    page: r.page,
    color: r.color as AnnotationColor,
    quotedText: r.quotedText,
    comment: r.comment,
    rects,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

export function toMe(r: UserRow): Me {
  const tier =
    r.subscriptionTier && SUBSCRIPTION_TIERS.has(r.subscriptionTier)
      ? (r.subscriptionTier as SubscriptionTier)
      : null
  const status =
    r.subscriptionStatus && SUBSCRIPTION_STATUSES.has(r.subscriptionStatus)
      ? (r.subscriptionStatus as SubscriptionStatus)
      : null
  return {
    userId: r.id,
    email: r.email,
    name: r.name,
    image: r.image,
    plan: (r.plan === "pro" ? "pro" : "free") as Plan,
    role: r.role === "admin" ? "admin" : "user",
    language: normalizeLanguage(r.language),
    subscriptionTier: tier,
    subscriptionStatus: status,
    subscriptionCurrentPeriodEnd: r.subscriptionCurrentPeriodEnd
      ? r.subscriptionCurrentPeriodEnd.toISOString()
      : null,
    createdAt: r.createdAt.toISOString(),
  }
}
