export type ID = string

export type Shelf = {
  id: ID
  name: string
  archivedAt: string | null
  createdAt: string
}

export type TutorPreset = "default" | "eli5" | "academic" | "socratic"

export type Notebook = {
  id: ID
  shelfId: ID
  title: string
  icon?: string
  cover?: string
  notes: NotebookDoc | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  tutorPreset?: TutorPreset
  customPrompt?: string
  /** ISO 639-1 override for AI generations in this notebook. Null = inherit user default. */
  language: string | null
}

// Cover keys live in /apps/web/public/icons/notebook_bgs/<key>.webp.
// Stored as the bare key (e.g. "vibrant_3") — file extension and path are
// reconstructed at render time so we can move/rename the asset folder later.
export const NOTEBOOK_COVERS = [
  "vibrant_1",
  "vibrant_2",
  "vibrant_3",
  "vibrant_4",
  "vibrant_5",
  "vibrant_6",
  "vibrant_7",
  "vibrant_8",
  "vibrant_9",
  "vibrant_10",
  "vibrant_11",
  "vibrant_12",
  "vibrant_13",
  "vibrant_14",
  "vibrant_15",
  "vibrant_16",
  "vibrant_17",
  "vibrant_18",
  "vibrant_19",
  "vibrant_20",
  "vibrant_21",
  "vibrant_22",
  "vibrant_23",
  "vibrant_24",
  "vibrant_25",
  "vibrant_26",
  "vibrant_27",
  "vibrant_28",
] as const

export type NotebookCover = (typeof NOTEBOOK_COVERS)[number]

export function isNotebookCover(value: unknown): value is NotebookCover {
  return typeof value === "string" && (NOTEBOOK_COVERS as readonly string[]).includes(value)
}

export function randomNotebookCover(): NotebookCover {
  const i = Math.floor(Math.random() * NOTEBOOK_COVERS.length)
  return NOTEBOOK_COVERS[i]!
}

export function notebookCoverImagePath(cover: string): string {
  return `/icons/notebook_bgs/${cover}.webp`
}

export type Chapter = {
  id: ID
  notebookId: ID
  order: number
  title: string
  markdown: string
  createdAt: string
  updatedAt: string
}

export type BlockMeta = {
  aiGenerated?: boolean
  sourceRefs?: ID[]
  version?: number
}

export type FlashcardCard = {
  question: string
  answer: string
  hint?: string | null
}
export type QuizQuestion = {
  question: string
  options: string[]
  correctAnswer: string
}

export type BlockType =
  | "paragraph"
  | "heading"
  | "list"
  | "code"
  | "callout"
  | "flashcard"
  | "quiz"
  | "audio"
  | "ai"

export type Block = {
  id: ID
  notebookId: ID
  type: BlockType
  content: unknown
  meta?: BlockMeta
}

export type SourceType = "text" | "youtube" | "article" | "file"

export type SourceStatus = "pending_upload" | "processing" | "ready" | "failed"

export type UploadFileExt =
  | "pdf"
  | "docx"
  | "txt"
  | "mp3"
  | "m4a"
  | "aac"
  | "mp4"
  | "webm"

export const SUPPORTED_UPLOAD_MIMES: Record<UploadFileExt, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  mp4: "video/mp4",
  // webm is the default MediaRecorder output on Chromium browsers; included
  // so in-browser audio captures can flow through the same upload path.
  webm: "audio/webm",
}

export const SUPPORTED_UPLOAD_EXTS = Object.keys(SUPPORTED_UPLOAD_MIMES) as UploadFileExt[]

export function uploadKindForMime(
  mime: string,
): "document" | "media" | null {
  if (mime === SUPPORTED_UPLOAD_MIMES.pdf) return "document"
  if (mime === SUPPORTED_UPLOAD_MIMES.docx) return "document"
  if (mime === SUPPORTED_UPLOAD_MIMES.txt) return "document"
  if (
    mime === SUPPORTED_UPLOAD_MIMES.mp3 ||
    mime === SUPPORTED_UPLOAD_MIMES.m4a ||
    mime === SUPPORTED_UPLOAD_MIMES.aac ||
    mime === SUPPORTED_UPLOAD_MIMES.mp4 ||
    mime === SUPPORTED_UPLOAD_MIMES.webm ||
    mime.startsWith("audio/webm") ||
    mime.startsWith("audio/ogg")
  ) {
    return "media"
  }
  return null
}

export type SummaryDepth = "normal" | "detailed"

export type GenerateOptions = {
  summary?: { depth: SummaryDepth; prompt?: string }
  flashcards?: { count: number }
  quizzes?: { count: number }
}

export type Plan = "free" | "pro"

export type UserRole = "user" | "admin"

export type SubscriptionTier = "weekly" | "monthly" | "yearly"

export type SubscriptionStatus =
  | "active"
  | "on_hold"
  | "cancelled"
  | "expired"
  | "failed"
  | "pending"

export type Summary = {
  id: ID
  notebookId: ID
  depth: SummaryDepth
  prompt: string | null
  markdown: string
  language: string
  createdAt: string
  updatedAt: string
}

export type MindmapDepth = "shallow" | "normal" | "deep"

export type FlowNode = {
  id: string
  position: { x: number; y: number }
  data: { label: string }
  type?: string
}

export type FlowEdge = {
  id: string
  source: string
  target: string
  type?: string
}

export type MindmapData = {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export type Mindmap = {
  id: ID
  notebookId: ID
  title: string
  prompt: string | null
  data: MindmapData
  language: string
  createdAt: string
  updatedAt: string
}

export type Me = {
  userId: ID
  email: string | null
  name: string | null
  image: string | null
  plan: Plan
  role: UserRole
  /** ISO 639-1 — user's preferred language for AI-generated content. */
  language: string
  subscriptionTier: SubscriptionTier | null
  subscriptionStatus: SubscriptionStatus | null
  subscriptionCurrentPeriodEnd: string | null
  createdAt: string
}

export type Source = {
  id: ID
  notebookId: ID
  type: SourceType
  title: string
  content: string
  mimeType: string | null
  fileName: string | null
  fileSizeBytes: number | null
  sourceUrl: string | null
  status: SourceStatus
  errorMessage: string | null
  processedAt: string | null
  archivedAt: string | null
  /** Translated copies of extractedText, keyed by ISO 639-1. Empty for
   *  PDFs (not translatable) and for sources nobody has translated yet. */
  translations: Record<string, string>
  createdAt: string
}

export const ANNOTATION_COLORS = [
  "yellow",
  "green",
  "blue",
  "pink",
  "purple",
] as const
export type AnnotationColor = (typeof ANNOTATION_COLORS)[number]

export type AnnotationRect = {
  x: number
  y: number
  w: number
  h: number
}

export type Annotation = {
  id: ID
  sourceId: ID
  notebookId: ID
  page: number
  color: AnnotationColor
  quotedText: string
  comment: string | null
  rects: AnnotationRect[]
  createdAt: string
  updatedAt: string
}

export type NotebookDoc = {
  type: "doc"
  content: unknown[]
}

export type OnboardingAnswers = {
  goal: string
  identity: string
  topics: string[]
  struggles: string[]
  learningStyle: string[]
  contentSources: string[]
  focusSpan: string
  organizationLevel: string
  desiredOutcome: string[]
  commitmentLevel: string
}

export type OnboardingResponse = {
  answers: OnboardingAnswers | null
  completed: boolean
}

export type ChatRole = "user" | "assistant"

export type ChatMessage = {
  id: ID
  role: ChatRole
  content: string
  createdAt: string
}

export type ChatSessionSummary = {
  id: ID
  title: string | null
  /** First user message in the session, truncated. Available on list
   *  endpoints; unset on detail responses. */
  preview?: string | null
  createdAt: string
  updatedAt: string
}

export type ChatSession = ChatSessionSummary & {
  messages: ChatMessage[]
}

export type Flashcard = {
  id: ID
  notebookId: ID
  question: string
  answer: string
  hint: string | null
  order: number
  language: string
  createdAt: string
}

export type Quiz = {
  id: ID
  notebookId: ID
  question: string
  options: string[]
  correctAnswer: string
  order: number
  language: string
  createdAt: string
}

export type Exam = {
  id: ID
  notebookId: ID
  question: string
  answer: string
  explanation?: string | null
  order: number
  createdAt: string
}

// Curated list of Kokoro 82M voices we expose to users. Each `id` is the
// exact voice token the Kokoro model expects (e.g. "af_bella"). Render in
// the picker; persist `id` on podcast rows. Adding/removing entries requires
// regenerating the matching sample MP3 under apps/web/public/voices/.
export const KOKORO_VOICES = [
  { id: "af_bella", label: "Bella", gender: "female", accent: "American" },
  { id: "af_nicole", label: "Nicole", gender: "female", accent: "American" },
  { id: "af_sky", label: "Sky", gender: "female", accent: "American" },
  { id: "am_michael", label: "Michael", gender: "male", accent: "American" },
  { id: "bf_emma", label: "Emma", gender: "female", accent: "British" },
  { id: "bf_isabella", label: "Isabella", gender: "female", accent: "British" },
  { id: "bm_george", label: "George", gender: "male", accent: "British" },
  { id: "bm_lewis", label: "Lewis", gender: "male", accent: "British" },
] as const

export type KokoroVoiceId = (typeof KOKORO_VOICES)[number]["id"]

export function isKokoroVoiceId(value: unknown): value is KokoroVoiceId {
  return (
    typeof value === "string" &&
    (KOKORO_VOICES as readonly { id: string }[]).some((v) => v.id === value)
  )
}

export type PodcastStatus = "pending" | "generating" | "ready" | "failed"

export type PodcastSpeaker = "host" | "guest"

export type PodcastScriptTurn = {
  speaker: PodcastSpeaker
  text: string
}

export type Podcast = {
  id: ID
  notebookId: ID
  status: PodcastStatus
  voicePrimary: KokoroVoiceId
  voiceSecondary: KokoroVoiceId
  script: PodcastScriptTurn[] | null
  durationSeconds: number | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export type ArchivedNotebook = Notebook & { shelfName: string }
export type ArchivedSource = Source & { notebookTitle: string }

export type ArchiveBundle = {
  shelves: Shelf[]
  notebooks: ArchivedNotebook[]
  sources: ArchivedSource[]
}
