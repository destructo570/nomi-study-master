import { triggerUpgradeModal } from "@/lib/upgrade-trigger"
import type {
  FlashcardCount,
  QuizCount,
  SubscriptionTier,
} from "@workspace/types/plan"
import type { ActionKey, CreditState } from "@workspace/types/quotas"
import type {
  Annotation,
  AnnotationColor,
  AnnotationRect,
  ArchiveBundle,
  Chapter,
  ChatSession,
  ChatSessionSummary,
  Exam,
  Flashcard,
  GenerateOptions,
  KokoroVoiceId,
  Me,
  Mindmap,
  MindmapData,
  MindmapDepth,
  Notebook,
  NotebookDoc,
  OnboardingAnswers,
  OnboardingResponse,
  Plan,
  Podcast,
  Quiz,
  Shelf,
  Source,
  SourceType,
  SubscriptionStatus,
  Summary,
  SummaryDepth,
  TutorPreset,
} from "@workspace/types"

export type ArchiveItemType = "shelf" | "notebook" | "source"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001"

export class QuotaExceededError extends Error {
  action?: string
  used?: number
  limit?: number
  period?: string
  constructor(opts: {
    action?: string
    used?: number
    limit?: number
    period?: string
    message?: string
  }) {
    super(opts.message ?? "Quota exceeded")
    this.name = "QuotaExceededError"
    this.action = opts.action
    this.used = opts.used
    this.limit = opts.limit
    this.period = opts.period
  }
}

export class RateLimitError extends Error {
  retryAfterSeconds?: number
  limit?: number
  window?: string
  constructor(opts: {
    retryAfterSeconds?: number
    limit?: number
    window?: string
    message?: string
  }) {
    super(opts.message ?? "Too many requests - please slow down.")
    this.name = "RateLimitError"
    this.retryAfterSeconds = opts.retryAfterSeconds
    this.limit = opts.limit
    this.window = opts.window
  }
}

export class PlanLimitError extends Error {
  limitKind: string
  current?: number
  limit?: number
  plan?: string
  constructor(opts: {
    limitKind: string
    current?: number
    limit?: number
    plan?: string
    message?: string
  }) {
    super(opts.message ?? "Plan limit exceeded")
    this.name = "PlanLimitError"
    this.limitKind = opts.limitKind
    this.current = opts.current
    this.limit = opts.limit
    this.plan = opts.plan
  }
}

export async function request<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, headers, ...rest } = init ?? {}
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })
  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login"
      }
      throw new Error("Unauthorized")
    }
    if (res.status === 429) {
      try {
        const body = (await res.json()) as {
          error?: string
          message?: string
          action?: string
          used?: number
          limit?: number
          period?: string
          window?: string
          retryAfterSeconds?: number
        }
        if (body.error === "rate_limited") {
          throw new RateLimitError({
            retryAfterSeconds: body.retryAfterSeconds,
            limit: body.limit,
            window: body.window,
            message: body.message ?? body.error,
          })
        }
        const err = new QuotaExceededError({
          action: body.action,
          used: body.used,
          limit: body.limit,
          period: body.period,
          message: body.message ?? body.error,
        })
        triggerUpgradeModal({
          kind: "quota_exceeded",
          action: body.action,
        })
        throw err
      } catch (err) {
        if (err instanceof RateLimitError) throw err
        if (err instanceof QuotaExceededError) throw err
        triggerUpgradeModal({ kind: "quota_exceeded" })
        throw new QuotaExceededError({})
      }
    }
    if (res.status === 403) {
      try {
        const body = (await res.json()) as {
          error?: string
          limitKind?: string
          current?: number
          limit?: number
          plan?: string
        }
        if (body.error === "plan_limit_exceeded" && body.limitKind) {
          const err = new PlanLimitError({
            limitKind: body.limitKind,
            current: body.current,
            limit: body.limit,
            plan: body.plan,
          })
          if (body.limitKind === "notebooks") {
            triggerUpgradeModal({
              kind: "notebook_limit",
              limit: body.limit ?? 0,
            })
          } else if (body.limitKind === "podcast_pro_only") {
            triggerUpgradeModal({
              kind: "pro_only",
              feature: "Podcasts",
            })
          }
          throw err
        }
        throw new Error(body.error ?? `Request failed (403): ${path}`)
      } catch (err) {
        if (err instanceof PlanLimitError) throw err
        throw err instanceof Error ? err : new Error(`Request failed (403): ${path}`)
      }
    }
    throw new Error(`Request failed (${res.status}): ${path}`)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  async submitFeedback(message: string): Promise<void> {
    await request("/api/feedback", { method: "POST", json: { message } })
  },

  async listShelves(): Promise<Shelf[]> {
    return request<Shelf[]>("/api/shelves")
  },

  async getShelf(id: string): Promise<Shelf | null> {
    return request<Shelf | null>(`/api/shelves/${id}`)
  },

  async createShelf(name: string): Promise<Shelf> {
    return request<Shelf>("/api/shelves", { method: "POST", json: { name } })
  },

  async renameShelf(id: string, name: string): Promise<Shelf | null> {
    return request<Shelf | null>(`/api/shelves/${id}`, {
      method: "PATCH",
      json: { name },
    })
  },

  async deleteShelf(id: string): Promise<void> {
    await request(`/api/shelves/${id}`, { method: "DELETE" })
  },

  async listNotebooks(shelfId?: string): Promise<Notebook[]> {
    const qs = shelfId ? `?shelfId=${encodeURIComponent(shelfId)}` : ""
    return request<Notebook[]>(`/api/notebooks${qs}`)
  },

  async listRecentNotebooks(limit = 5): Promise<Notebook[]> {
    return request<Notebook[]>(`/api/notebooks/recent?limit=${limit}`)
  },

  async getNotebook(id: string): Promise<Notebook | null> {
    return request<Notebook | null>(`/api/notebooks/${id}`)
  },

  async createNotebook(
    shelfId: string,
    title: string,
    cover?: string,
    language?: string,
  ): Promise<Notebook> {
    return request<Notebook>("/api/notebooks", {
      method: "POST",
      json: { shelfId, title, cover, language },
    })
  },

  async renameNotebook(id: string, title: string): Promise<Notebook | null> {
    return request<Notebook | null>(`/api/notebooks/${id}`, {
      method: "PATCH",
      json: { title },
    })
  },

  async updateNotebookCover(
    id: string,
    cover: string,
  ): Promise<Notebook | null> {
    return request<Notebook | null>(`/api/notebooks/${id}`, {
      method: "PATCH",
      json: { cover },
    })
  },

  async updateNotebookTutorPreset(
    id: string,
    tutorPreset: TutorPreset | null,
  ): Promise<Notebook | null> {
    return request<Notebook | null>(`/api/notebooks/${id}`, {
      method: "PATCH",
      json: { tutorPreset },
    })
  },

  async updateNotebookLanguage(
    id: string,
    language: string | null,
  ): Promise<Notebook | null> {
    return request<Notebook | null>(`/api/notebooks/${id}`, {
      method: "PATCH",
      json: { language },
    })
  },

  async saveNotebookNotes(
    id: string,
    notes: NotebookDoc | null,
  ): Promise<Notebook | null> {
    return request<Notebook | null>(`/api/notebooks/${id}`, {
      method: "PATCH",
      json: { notes },
    })
  },

  async deleteNotebook(id: string): Promise<void> {
    await request(`/api/notebooks/${id}`, { method: "DELETE" })
  },

  async getNotebookDoc(id: string): Promise<NotebookDoc | null> {
    return request<NotebookDoc | null>(`/api/notebooks/${id}/doc`)
  },

  async saveNotebookDoc(id: string, doc: NotebookDoc): Promise<void> {
    await request(`/api/notebooks/${id}/doc`, { method: "PUT", json: doc })
  },

  async listSources(notebookId: string): Promise<Source[]> {
    return request<Source[]>(`/api/notebooks/${notebookId}/sources`)
  },

  async addSource(
    input:
      | {
          notebookId: string
          type: "text"
          title: string
          content: string
        }
      | {
          notebookId: string
          type: "url"
          url: string
          title?: string
        },
  ): Promise<Source> {
    const { notebookId, ...rest } = input
    return request<Source>(`/api/notebooks/${notebookId}/sources`, {
      method: "POST",
      json: rest,
    })
  },

  async createSourceUploadUrl(input: {
    notebookId: string
    fileName: string
    mimeType: string
    sizeBytes: number
  }): Promise<{ source: Source; uploadUrl: string; storageKey: string }> {
    return request<{ source: Source; uploadUrl: string; storageKey: string }>(
      `/api/notebooks/${input.notebookId}/sources/upload-url`,
      {
        method: "POST",
        json: {
          fileName: input.fileName,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
        },
      },
    )
  },

  async completeSourceUpload(input: {
    notebookId: string
    sourceId: string
    title?: string
  }): Promise<Source> {
    return request<Source>(
      `/api/notebooks/${input.notebookId}/sources/${input.sourceId}/complete-upload`,
      {
        method: "POST",
        json: input.title ? { title: input.title } : {},
      },
    )
  },

  async retrySourceUpload(input: {
    notebookId: string
    sourceId: string
  }): Promise<Source> {
    return request<Source>(
      `/api/notebooks/${input.notebookId}/sources/${input.sourceId}/retry`,
      { method: "POST", json: {} },
    )
  },

  async updateSource(
    id: string,
    input: { title?: string; content?: string },
  ): Promise<Source> {
    return request<Source>(`/api/sources/${id}`, {
      method: "PATCH",
      json: input,
    })
  },

  async deleteSource(id: string): Promise<void> {
    await request(`/api/sources/${id}`, { method: "DELETE" })
  },

  async getSourceFileUrl(id: string): Promise<{ url: string }> {
    return request<{ url: string }>(`/api/sources/${id}/file-url`)
  },

  async translateSource(
    sourceId: string,
    input: { targetLanguage: string },
  ): Promise<Source> {
    return request<Source>(`/api/sources/${sourceId}/translate`, {
      method: "POST",
      json: input,
    })
  },

  async listAnnotations(sourceId: string): Promise<Annotation[]> {
    return request<Annotation[]>(`/api/sources/${sourceId}/annotations`)
  },

  async createAnnotation(input: {
    sourceId: string
    page: number
    color: AnnotationColor
    quotedText: string
    comment?: string | null
    rects: AnnotationRect[]
  }): Promise<Annotation> {
    return request<Annotation>(`/api/sources/${input.sourceId}/annotations`, {
      method: "POST",
      json: {
        page: input.page,
        color: input.color,
        quotedText: input.quotedText,
        comment: input.comment ?? null,
        rects: input.rects,
      },
    })
  },

  async updateAnnotation(
    annotationId: string,
    patch: { color?: AnnotationColor; comment?: string | null },
  ): Promise<Annotation> {
    return request<Annotation>(`/api/sources/annotations/${annotationId}`, {
      method: "PATCH",
      json: patch,
    })
  },

  async deleteAnnotation(annotationId: string): Promise<void> {
    await request(`/api/sources/annotations/${annotationId}`, {
      method: "DELETE",
    })
  },

  async listChatSessions(notebookId: string): Promise<ChatSessionSummary[]> {
    return request<ChatSessionSummary[]>(
      `/api/notebooks/${notebookId}/chat/sessions`,
    )
  },

  async listStandaloneChatSessions(): Promise<ChatSessionSummary[]> {
    return request<ChatSessionSummary[]>(`/api/chat/sessions`)
  },

  async getChatSession(sessionId: string): Promise<ChatSession> {
    return request<ChatSession>(`/api/chat/sessions/${sessionId}`)
  },

  async deleteChatSession(sessionId: string): Promise<void> {
    await request(`/api/chat/sessions/${sessionId}`, { method: "DELETE" })
  },

  async getSummary(notebookId: string): Promise<Summary | null> {
    return request<Summary | null>(`/api/notebooks/${notebookId}/summary`)
  },

  async listSummaries(notebookId: string): Promise<Summary[]> {
    return request<Summary[]>(`/api/notebooks/${notebookId}/summaries`)
  },

  async saveSummary(
    notebookId: string,
    input: { id: string; markdown: string },
  ): Promise<Summary> {
    return request<Summary>(`/api/notebooks/${notebookId}/summary`, {
      method: "PUT",
      json: input,
    })
  },

  async generateSummary(
    notebookId: string,
    input: { depth: SummaryDepth; prompt?: string; language?: string },
  ): Promise<Summary> {
    return request<Summary>(`/api/notebooks/${notebookId}/summary/generate`, {
      method: "POST",
      json: input,
    })
  },

  async translateSummary(
    notebookId: string,
    input: { targetLanguage: string },
  ): Promise<Summary> {
    return request<Summary>(`/api/notebooks/${notebookId}/summary/translate`, {
      method: "POST",
      json: input,
    })
  },

  async listChapters(notebookId: string): Promise<Chapter[]> {
    return request<Chapter[]>(`/api/notebooks/${notebookId}/chapters`)
  },

  async getChapter(id: string): Promise<Chapter | null> {
    return request<Chapter | null>(`/api/chapters/${id}`)
  },

  async saveChapter(
    id: string,
    patch: { title?: string; markdown?: string },
  ): Promise<Chapter | null> {
    return request<Chapter | null>(`/api/chapters/${id}`, {
      method: "PATCH",
      json: patch,
    })
  },

  async createNotebookFromCourse(input: {
    shelfId: string
    title: string
    cover?: string
    tutorPreset?: TutorPreset
    customPrompt?: string
    language?: string
    source: {
      type: Extract<SourceType, "text" | "youtube">
      title: string
      content: string
      sizeBytes?: number
    }
    generateOptions?: GenerateOptions
  }): Promise<Notebook> {
    return request<Notebook>("/api/notebooks/from-course", {
      method: "POST",
      json: input,
    })
  },

  async listFlashcards(notebookId: string): Promise<Flashcard[]> {
    return request<Flashcard[]>(`/api/notebooks/${notebookId}/flashcards`)
  },

  async addFlashcard(input: {
    notebookId: string
    question: string
    answer: string
    hint?: string | null
    order?: number
  }): Promise<Flashcard> {
    return request<Flashcard>(`/api/notebooks/${input.notebookId}/flashcards`, {
      method: "POST",
      json: {
        question: input.question,
        answer: input.answer,
        hint: input.hint ?? null,
        order: input.order,
      },
    })
  },

  async generateFlashcards(
    notebookId: string,
    input: { count: FlashcardCount; prompt?: string; language?: string },
  ): Promise<Flashcard[]> {
    return request<Flashcard[]>(
      `/api/notebooks/${notebookId}/flashcards/generate`,
      { method: "POST", json: input },
    )
  },

  async translateFlashcards(
    notebookId: string,
    input: { targetLanguage: string },
  ): Promise<Flashcard[]> {
    return request<Flashcard[]>(
      `/api/notebooks/${notebookId}/flashcards/translate`,
      { method: "POST", json: input },
    )
  },

  async updateFlashcard(
    id: string,
    patch: { question?: string; answer?: string; hint?: string | null },
  ): Promise<Flashcard | null> {
    return request<Flashcard | null>(`/api/flashcards/${id}`, {
      method: "PATCH",
      json: patch,
    })
  },

  async deleteFlashcard(id: string): Promise<void> {
    await request(`/api/flashcards/${id}`, { method: "DELETE" })
  },

  async listQuizzes(notebookId: string): Promise<Quiz[]> {
    return request<Quiz[]>(`/api/notebooks/${notebookId}/quizzes`)
  },

  async addQuiz(input: {
    notebookId: string
    question: string
    options: string[]
    correctAnswer: string
    order?: number
  }): Promise<Quiz> {
    return request<Quiz>(`/api/notebooks/${input.notebookId}/quizzes`, {
      method: "POST",
      json: {
        question: input.question,
        options: input.options,
        correctAnswer: input.correctAnswer,
        order: input.order,
      },
    })
  },

  async generateQuizzes(
    notebookId: string,
    input: { count: QuizCount; prompt?: string; language?: string },
  ): Promise<Quiz[]> {
    return request<Quiz[]>(
      `/api/notebooks/${notebookId}/quizzes/generate`,
      { method: "POST", json: input },
    )
  },

  async translateQuizzes(
    notebookId: string,
    input: { targetLanguage: string },
  ): Promise<Quiz[]> {
    return request<Quiz[]>(
      `/api/notebooks/${notebookId}/quizzes/translate`,
      { method: "POST", json: input },
    )
  },

  async updateQuiz(
    id: string,
    patch: { question?: string; options?: string[]; correctAnswer?: string },
  ): Promise<Quiz | null> {
    return request<Quiz | null>(`/api/quizzes/${id}`, {
      method: "PATCH",
      json: patch,
    })
  },

  async deleteQuiz(id: string): Promise<void> {
    await request(`/api/quizzes/${id}`, { method: "DELETE" })
  },

  async listMindmaps(notebookId: string): Promise<Mindmap[]> {
    return request<Mindmap[]>(`/api/notebooks/${notebookId}/mindmaps`)
  },

  async addMindmap(input: {
    notebookId: string
    title?: string
    data?: MindmapData
  }): Promise<Mindmap> {
    return request<Mindmap>(`/api/notebooks/${input.notebookId}/mindmaps`, {
      method: "POST",
      json: { title: input.title, data: input.data },
    })
  },

  async generateMindmap(
    notebookId: string,
    input: { title?: string; prompt?: string; depth?: MindmapDepth; language?: string },
  ): Promise<Mindmap> {
    return request<Mindmap>(
      `/api/notebooks/${notebookId}/mindmaps/generate`,
      { method: "POST", json: input },
    )
  },

  async translateMindmap(
    notebookId: string,
    input: { targetLanguage: string },
  ): Promise<Mindmap> {
    return request<Mindmap>(
      `/api/notebooks/${notebookId}/mindmaps/translate`,
      { method: "POST", json: input },
    )
  },

  async updateMindmap(
    id: string,
    patch: { title?: string; data?: MindmapData },
  ): Promise<Mindmap | null> {
    return request<Mindmap | null>(`/api/mindmaps/${id}`, {
      method: "PATCH",
      json: patch,
    })
  },

  async deleteMindmap(id: string): Promise<void> {
    await request(`/api/mindmaps/${id}`, { method: "DELETE" })
  },

  async listExam(notebookId: string): Promise<Exam[]> {
    return request<Exam[]>(`/api/notebooks/${notebookId}/exam`)
  },

  async addExam(input: {
    notebookId: string
    question: string
    answer: string
    explanation?: string
    order?: number
  }): Promise<Exam> {
    return request<Exam>(`/api/notebooks/${input.notebookId}/exam`, {
      method: "POST",
      json: {
        question: input.question,
        answer: input.answer,
        explanation: input.explanation,
        order: input.order,
      },
    })
  },

  async deleteExam(id: string): Promise<void> {
    await request(`/api/exams/${id}`, { method: "DELETE" })
  },

  async getPodcast(notebookId: string): Promise<Podcast | null> {
    return request<Podcast | null>(
      `/api/podcasts?notebookId=${encodeURIComponent(notebookId)}`,
    )
  },

  async generatePodcast(input: {
    notebookId: string
    voicePrimary: KokoroVoiceId
    voiceSecondary: KokoroVoiceId
  }): Promise<Podcast> {
    return request<Podcast>(`/api/podcasts`, {
      method: "POST",
      json: input,
    })
  },

  async getPodcastAudioUrl(podcastId: string): Promise<{ url: string }> {
    return request<{ url: string }>(`/api/podcasts/${podcastId}/audio`)
  },

  async deletePodcast(podcastId: string): Promise<void> {
    await request(`/api/podcasts/${podcastId}`, { method: "DELETE" })
  },

  async getArchive(): Promise<ArchiveBundle> {
    return request<ArchiveBundle>("/api/archive")
  },

  async restoreArchived(input: {
    type: ArchiveItemType
    id: string
  }): Promise<void> {
    await request("/api/archive/restore", { method: "POST", json: input })
  },

  async deleteArchived(input: {
    type: ArchiveItemType
    id: string
  }): Promise<void> {
    await request(
      `/api/archive/${input.type}/${encodeURIComponent(input.id)}`,
      { method: "DELETE" },
    )
  },

  async emptyArchive(): Promise<void> {
    await request("/api/archive/empty", { method: "POST", json: {} })
  },

  async getMe(): Promise<Me> {
    return request<Me>("/api/me")
  },

  async updateMe(patch: { language?: string }): Promise<Me> {
    return request<Me>("/api/me", { method: "PATCH", json: patch })
  },

  async getUsage(): Promise<UsageResponse> {
    return request<UsageResponse>("/api/me/usage")
  },

  async submitCreditPromo(input: {
    postUrl: string
    platform: "tiktok" | "instagram"
  }): Promise<CreditPromoSubmission> {
    return request<CreditPromoSubmission>("/api/me/credits/promo-submissions", {
      method: "POST",
      json: input,
    })
  },

  async listCreditPromoSubmissions(): Promise<CreditPromoSubmission[]> {
    return request<CreditPromoSubmission[]>(
      "/api/me/credits/promo-submissions",
    )
  },

  async adminListPromoSubmissions(
    status?: "pending" | "approved" | "rejected",
  ): Promise<AdminPromoSubmissionRow[]> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : ""
    return request<AdminPromoSubmissionRow[]>(
      `/api/admin/credits/promo-submissions${qs}`,
    )
  },

  async adminReviewPromoSubmission(input: {
    id: string
    status: "approved" | "rejected"
    creditsAwarded?: number
    viewsAtApproval?: number
    notes?: string
  }): Promise<{
    ok: true
    submission: CreditPromoSubmission
    credits: CreditState | null
  }> {
    const { id, ...body } = input
    return request<{
      ok: true
      submission: CreditPromoSubmission
      credits: CreditState | null
    }>(`/api/admin/credits/promo-submissions/${id}/review`, {
      method: "POST",
      json: body,
    })
  },

  async adminListFeedback(): Promise<AdminFeedbackRow[]> {
    return request<AdminFeedbackRow[]>("/api/admin/feedback")
  },

  async adminGrantCredits(input: {
    userId: string
    amount: number
    reason: string
    source?: string
  }): Promise<{ ok: true; credits: CreditState }> {
    return request<{ ok: true; credits: CreditState }>(
      "/api/admin/credits/grant",
      { method: "POST", json: input },
    )
  },

  async getSubscription(): Promise<SubscriptionInfo> {
    return request<SubscriptionInfo>("/api/billing/subscription")
  },

  async createCheckout(
    tier: SubscriptionTier,
  ): Promise<{ checkoutUrl: string; sessionId: string }> {
    return request<{ checkoutUrl: string; sessionId: string }>(
      "/api/billing/checkout",
      { method: "POST", json: { tier } },
    )
  },

  async cancelSubscription(input?: {
    feedback?: string
    comment?: string
  }): Promise<{ ok: true }> {
    return request<{ ok: true }>("/api/billing/cancel", {
      method: "POST",
      json: input ?? {},
    })
  },

  async llmTestListDocuments(): Promise<LlmTestDocument[]> {
    return request<LlmTestDocument[]>("/api/llm-test/documents")
  },

  async llmTestQuery(input: {
    docId: string
    query: string
  }): Promise<LlmTestResponse> {
    return request<LlmTestResponse>("/api/llm-test/query", {
      method: "POST",
      json: input,
    })
  },

  async llmTestNoAnswer(input: { docId: string }): Promise<LlmTestResponse> {
    return request<LlmTestResponse>("/api/llm-test/no-answer", {
      method: "POST",
      json: input,
    })
  },

  async llmTestRaw(input: {
    input: string
    query?: string
    skipRetrieval?: boolean
    noAnswer?: boolean
  }): Promise<LlmTestResponse> {
    return request<LlmTestResponse>("/api/llm-test/raw", {
      method: "POST",
      json: input,
    })
  },

  async llmTestEval(input: {
    docId: string
    query: string
    rating: LlmTestRating
    answer?: string
  }): Promise<{ ok: true }> {
    return request<{ ok: true }>("/api/llm-test/eval", {
      method: "POST",
      json: input,
    })
  },

  async getOnboarding(): Promise<OnboardingResponse> {
    return request<OnboardingResponse>("/api/onboarding")
  },

  async saveOnboarding(answers: OnboardingAnswers): Promise<OnboardingResponse> {
    return request<OnboardingResponse>("/api/onboarding", {
      method: "POST",
      json: answers,
    })
  },

  async fetchDiscount(): Promise<DiscountInfo | null> {
    return request<DiscountInfo | null>("/api/discount")
  },
}

export type Api = typeof api

export type ActionCost = {
  action: ActionKey
  label: string
  cost: number
}

export type UsageResponse = {
  plan: Plan
  credits: CreditState | null
  actionCosts: ActionCost[]
}

export type CreditPromoSubmission = {
  id: string
  userId: string
  platform: string
  postUrl: string
  status: "pending" | "approved" | "rejected"
  viewsAtSubmit: number | null
  viewsAtApproval: number | null
  creditsAwarded: number
  notes: string | null
  submittedAt: string
  reviewedAt: string | null
  reviewedBy: string | null
}

export type AdminPromoSubmissionRow = {
  submission: CreditPromoSubmission
  userEmail: string | null
  userName: string | null
}

export type AdminFeedbackRow = {
  feedback: {
    id: string
    userId: string | null
    message: string
    userAgent: string | null
    createdAt: string
  }
  userEmail: string | null
  userName: string | null
}

export type DiscountInfo = {
  title: string
  code: string
  time: number
}

export type SubscriptionInfo = {
  tier: SubscriptionTier | null
  status: SubscriptionStatus | null
  currentPeriodEnd: string | null
  subscriptionId: string | null
}

export type LlmTestRating = "correct" | "partial" | "wrong" | "hallucination"

export type LlmTestDocument = {
  id: string
  notebookId: string
  notebookTitle: string
  title: string
  status: string
  mimeType: string | null
  fileName: string | null
  chunkCount: number
  indexedAt: string | null
  createdAt: string
}

export type LlmTestChunk = {
  id: string
  sourceId: string
  sourceTitle: string
  page: number
  text: string
  score: number
}

export type LlmTestMetrics = {
  totalLatencyMs: number
  embeddingMs: number
  retrievalMs: number
  generationMs: number
  chunksUsed: number
  contextChars: number
  contextTokensApprox: number
  citedIndices: number[]
}

export type LlmTestResponse = {
  query: string
  answer: string
  chunks: LlmTestChunk[]
  metrics: LlmTestMetrics
  systemPrompt: string
  finalPrompt: string
  noAnswer: boolean
}
