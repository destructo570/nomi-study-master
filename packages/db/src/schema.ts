import { sql } from "drizzle-orm"
import {
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

const vector = customType<{
  data: number[]
  driverData: string
  config: { dimensions: number }
}>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 1536})`
  },
  toDriver(value) {
    return `[${value.join(",")}]`
  },
  fromDriver(value) {
    return value
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map(Number)
  },
})

/* ------------------------------------------------------------------ */
/* Better Auth: user / session / account / verification                */
/* ------------------------------------------------------------------ */

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name"),
  image: text("image"),
  plan: text("plan").notNull().default("free"),
  role: text("role").notNull().default("user"),
  language: text("language").notNull().default("en"),
  dodoCustomerId: text("dodo_customer_id"),
  dodoSubscriptionId: text("dodo_subscription_id"),
  subscriptionTier: text("subscription_tier"),
  subscriptionStatus: text("subscription_status"),
  subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userIdx: index("sessions_user_idx").on(t.userId),
  })
)

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userIdx: index("accounts_user_idx").on(t.userId),
  })
)

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

/* ------------------------------------------------------------------ */
/* Quota usage                                                          */
/* ------------------------------------------------------------------ */

export const usage = pgTable(
  "usage",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actionKey: text("action_key").notNull(),
    periodStart: date("period_start").notNull(),
    count: integer("count").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.actionKey, t.periodStart] }),
  })
)

/* ------------------------------------------------------------------ */
/* Credits                                                              */
/* ------------------------------------------------------------------ */

export const userCredits = pgTable("user_credits", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(0),
  lifetimeGranted: integer("lifetime_granted").notNull().default(0),
  lifetimeConsumed: integer("lifetime_consumed").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const creditGrants = pgTable(
  "credit_grants",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(),
    reason: text("reason").notNull(),
    source: text("source").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userIdx: index("credit_grants_user_idx").on(t.userId, t.createdAt),
  })
)

export const creditPromoSubmissions = pgTable(
  "credit_promo_submissions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    postUrl: text("post_url").notNull(),
    status: text("status").notNull().default("pending"),
    viewsAtSubmit: integer("views_at_submit"),
    viewsAtApproval: integer("views_at_approval"),
    creditsAwarded: integer("credits_awarded").notNull().default(0),
    notes: text("notes"),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: text("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (t) => ({
    userIdx: index("credit_promo_user_idx").on(t.userId, t.submittedAt),
    statusIdx: index("credit_promo_status_idx").on(t.status, t.submittedAt),
  })
)

/* ------------------------------------------------------------------ */
/* App tables                                                           */
/* ------------------------------------------------------------------ */

export const shelves = pgTable("shelves", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const notebooks = pgTable("notebooks", {
  id: text("id").primaryKey(),
  shelfId: text("shelf_id")
    .notNull()
    .references(() => shelves.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  icon: text("icon"),
  cover: text("cover"),
  tutorPreset: text("tutor_preset"),
  customPrompt: text("custom_prompt"),
  /** ISO 639-1 — overrides users.language for AI generations in this notebook. NULL = inherit user default. */
  language: text("language"),
  notes: jsonb("notes"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const chapters = pgTable("chapters", {
  id: text("id").primaryKey(),
  notebookId: text("notebook_id")
    .notNull()
    .references(() => notebooks.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  markdown: text("markdown").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const sources = pgTable("sources", {
  id: text("id").primaryKey(),
  notebookId: text("notebook_id")
    .notNull()
    .references(() => notebooks.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  mimeType: text("mime_type"),
  fileName: text("file_name"),
  fileSizeBytes: integer("file_size_bytes"),
  storageKey: text("storage_key"),
  sourceUrl: text("source_url"),
  status: text("status").notNull().default("ready"),
  extractedText: text("extracted_text"),
  /** lang-code -> translated extractedText. Original stays canonical. */
  translations: jsonb("translations")
    .notNull()
    .default(sql`'{}'::jsonb`)
    .$type<Record<string, string>>(),
  errorMessage: text("error_message"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  indexedAt: timestamp("indexed_at", { withTimezone: true }),
  indexError: text("index_error"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const sourceAnnotations = pgTable(
  "source_annotations",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    notebookId: text("notebook_id")
      .notNull()
      .references(() => notebooks.id, { onDelete: "cascade" }),
    page: integer("page").notNull(),
    color: text("color").notNull().default("yellow"),
    quotedText: text("quoted_text").notNull().default(""),
    comment: text("comment"),
    rects: jsonb("rects")
      .notNull()
      .$type<{ x: number; y: number; w: number; h: number }[]>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    sourceIdx: index("source_annotations_source_idx").on(t.sourceId),
  })
)

export const summaries = pgTable(
  "summaries",
  {
    id: text("id").primaryKey(),
    notebookId: text("notebook_id")
      .notNull()
      .references(() => notebooks.id, { onDelete: "cascade" }),
    depth: text("depth").notNull().default("normal"),
    prompt: text("prompt"),
    markdown: text("markdown").notNull().default(""),
    language: text("language").notNull().default("en"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    notebookLanguageIdx: index("summaries_notebook_language_idx").on(
      t.notebookId,
      t.language
    ),
  })
)

export const notebookDocs = pgTable("notebook_docs", {
  notebookId: text("notebook_id")
    .primaryKey()
    .references(() => notebooks.id, { onDelete: "cascade" }),
  content: jsonb("content").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: text("id").primaryKey(),
    notebookId: text("notebook_id").references(() => notebooks.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    title: text("title"),
    summary: text("summary"),
    summaryUpToMessageId: text("summary_up_to_message_id"),
    summaryUpdatedAt: timestamp("summary_updated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userIdx: index("chat_sessions_user_idx").on(t.userId, t.updatedAt),
  })
)

export const chatMessages = pgTable("chat_messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  notebookId: text("notebook_id").references(() => notebooks.id, {
    onDelete: "cascade",
  }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  citations: jsonb("citations").$type<ChatCitation[]>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export type ChatCitation = {
  sourceId: string
  title: string
  page: number
}

export const sourceChunks = pgTable(
  "source_chunks",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    notebookId: text("notebook_id")
      .notNull()
      .references(() => notebooks.id, { onDelete: "cascade" }),
    page: integer("page").notNull(),
    ord: integer("ord").notNull(),
    text: text("text").notNull(),
    tokenCount: integer("token_count").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    contentHash: text("content_hash"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    sourceIdx: index("source_chunks_source_idx").on(t.sourceId),
    notebookIdx: index("source_chunks_notebook_idx").on(t.notebookId),
    contentHashIdx: index("source_chunks_content_hash_idx").on(t.contentHash),
  })
)

export const flashcards = pgTable(
  "flashcards",
  {
    id: text("id").primaryKey(),
    notebookId: text("notebook_id")
      .notNull()
      .references(() => notebooks.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    hint: text("hint"),
    order: integer("order").notNull().default(0),
    language: text("language").notNull().default("en"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    notebookLanguageIdx: index("flashcards_notebook_language_idx").on(
      t.notebookId,
      t.language
    ),
  })
)

export const quizzes = pgTable(
  "quizzes",
  {
    id: text("id").primaryKey(),
    notebookId: text("notebook_id")
      .notNull()
      .references(() => notebooks.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    options: jsonb("options").notNull().$type<string[]>(),
    correctAnswer: text("correct_answer").notNull(),
    order: integer("order").notNull().default(0),
    language: text("language").notNull().default("en"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    notebookLanguageIdx: index("quizzes_notebook_language_idx").on(
      t.notebookId,
      t.language
    ),
  })
)

export const mindmaps = pgTable(
  "mindmaps",
  {
    id: text("id").primaryKey(),
    notebookId: text("notebook_id")
      .notNull()
      .references(() => notebooks.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    prompt: text("prompt"),
    data: jsonb("data").notNull(),
    language: text("language").notNull().default("en"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    notebookLanguageIdx: index("mindmaps_notebook_language_idx").on(
      t.notebookId,
      t.language
    ),
  })
)

export const podcasts = pgTable("podcasts", {
  id: text("id").primaryKey(),
  // One podcast per notebook — regenerate replaces in place.
  notebookId: text("notebook_id")
    .notNull()
    .unique()
    .references(() => notebooks.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  voicePrimary: text("voice_primary").notNull(),
  voiceSecondary: text("voice_secondary").notNull(),
  scriptJson:
    jsonb("script_json").$type<{ speaker: "host" | "guest"; text: string }[]>(),
  audioStorageKey: text("audio_storage_key"),
  durationSeconds: integer("duration_seconds"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

/* ------------------------------------------------------------------ */
/* Blog                                                                 */
/* ------------------------------------------------------------------ */

export const posts = pgTable(
  "posts",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    /** MDX-flavored markdown body. Rendered server-side. */
    content: text("content").notNull(),
    coverImage: text("cover_image"),
    coverAlt: text("cover_alt"),
    author: text("author").notNull().default("nomi team"),
    tags: jsonb("tags")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    faq: jsonb("faq").$type<{ q: string; a: string }[] | null>(),
    howTo: jsonb("how_to").$type<{ name: string; steps: string[] } | null>(),
    readingMinutes: integer("reading_minutes").notNull().default(5),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    publishedIdx: index("posts_published_idx").on(t.publishedAt),
  })
)

export const feedback = pgTable(
  "feedback",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    message: text("message").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userIdx: index("feedback_user_idx").on(t.userId, t.createdAt),
    createdIdx: index("feedback_created_idx").on(t.createdAt),
  })
)

export const onboardingAnswers = pgTable("onboarding_answers", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  answers: jsonb("answers")
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const exams = pgTable("exams", {
  id: text("id").primaryKey(),
  notebookId: text("notebook_id")
    .notNull()
    .references(() => notebooks.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  explanation: text("explanation"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

/* ------------------------------------------------------------------ */
/* SEO content pages                                                   */
/*                                                                      */
/* Programmatic SEO pages generated by the content pipeline            */
/* (apps/backend/src/content). Unlike `posts` (blog), this table holds */
/* feature pages, alternative pages, comparison pages, tutorials, etc. */
/* The body is plain Markdown; the full structured payload              */
/* (seo block, schema.org, internal links, images, scoring) is stored  */
/* as JSON in `payload` so the source of truth is reconstructable.    */
/* ------------------------------------------------------------------ */
export const seoPages = pgTable(
  "seo_pages",
  {
    id: text("id").primaryKey(),
    /** Discriminator: feature | alternative | comparison | tutorial | faq | landing (blog uses `posts`). */
    type: text("type").notNull(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    /** Short meta description. */
    description: text("description").notNull(),
    /** Markdown body (rendered server-side). */
    content: text("content").notNull(),
    tags: jsonb("tags")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    faq: jsonb("faq").$type<{ q: string; a: string }[] | null>(),
    /** Full structured payload from the generator (seo block, schema.org, links, images, scores). */
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    /** Overall quality score 0-100, produced by the scorer. Null = not yet scored. */
    score: integer("score"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    typeIdx: index("seo_pages_type_idx").on(t.type),
    publishedIdx: index("seo_pages_published_idx").on(t.publishedAt),
  }),
)

/* ------------------------------------------------------------------ */
/* Content generation jobs                                              */
/*                                                                      */
/* Each run of the content engine (apps/backend/src/content/engine)    */
/* records a job. The generation screen polls GET /admin/content/jobs   */
/* for status. The full JobStatus (stages, logs, progress, score) lives */
/* in `payload`; the table indexes only the fields used for filtering.  */
/* ------------------------------------------------------------------ */
export const seoJobs = pgTable(
  "seo_jobs",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    topic: text("topic").notNull(),
    status: text("status").notNull().default("queued"),
    score: integer("score"),
    /** Full JobStatus payload (schemas.ts jobStatusSchema). */
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    /** Result artifact id (== job id when a GenerationResult was produced). */
    resultId: text("result_id"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    statusIdx: index("seo_jobs_status_idx").on(t.status),
    typeIdx: index("seo_jobs_type_idx").on(t.type),
  }),
)

export const misc = pgTable("misc", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  value: jsonb("value").notNull().$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})
