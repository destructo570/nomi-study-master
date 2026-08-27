// Article scraping via Firecrawl /v2/scrape, followed by an LLM cleanup
// pass that strips the site chrome (nav, footers, "Open in app" / "Sign
// up" prompts, reCAPTCHA notices, follow widgets) Firecrawl's
// `onlyMainContent` doesn't catch on Medium-style pages.
//
// The cleanup is intentionally non-rewriting: the LLM is instructed to
// return the article body verbatim, only removing boilerplate.

import OpenAI from "openai"

const SCRAPE_ENDPOINT = "https://api.firecrawl.dev/v2/scrape"

export class ArticleFetchError extends Error {
  status: number
  constructor(status: number, detail: string) {
    super(detail)
    this.name = "ArticleFetchError"
    this.status = status
  }
}

export class ArticleEmptyError extends Error {
  constructor() {
    super("The page returned no extractable content.")
    this.name = "ArticleEmptyError"
  }
}

export type ArticleScrapeResult = {
  url: string
  markdown: string
  title: string | null
  description: string | null
  thumbnailUrl: string | null
}

const MAX_ATTEMPTS = 3

export async function fetchArticle(url: string): Promise<ArticleScrapeResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY not set")

  let attempt = 0
  let lastErr: unknown
  while (attempt < MAX_ATTEMPTS) {
    attempt++
    let res: Response
    try {
      res = await fetch(SCRAPE_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          formats: ["markdown"],
          onlyMainContent: true,
        }),
      })
    } catch (err) {
      lastErr = err
      await sleep(backoffDelayMs(attempt))
      continue
    }

    if (res.status === 200) {
      const json = (await res.json()) as FirecrawlScrapeResponse
      if (!json.success || !json.data) {
        throw new ArticleFetchError(200, json.error ?? "Firecrawl returned no data")
      }
      const raw = (json.data.markdown ?? "").trim()
      if (!raw) throw new ArticleEmptyError()
      const meta = json.data.metadata ?? {}
      const markdown = await cleanArticleMarkdown(raw)
      const title = pickTitle(meta) ?? extractFirstHeading(markdown)
      return {
        url: meta.sourceURL ?? meta.url ?? url,
        markdown,
        title,
        description: meta.description ?? null,
        thumbnailUrl: meta.ogImage ?? null,
      }
    }

    if (res.status === 408 || res.status === 429 || res.status >= 500) {
      const retryAfter = Number(res.headers.get("retry-after"))
      const delay = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : backoffDelayMs(attempt)
      lastErr = new ArticleFetchError(res.status, await safeReadDetail(res))
      if (attempt >= MAX_ATTEMPTS) break
      await sleep(delay)
      continue
    }

    throw new ArticleFetchError(res.status, await safeReadDetail(res))
  }

  if (lastErr instanceof Error) throw lastErr
  throw new ArticleFetchError(0, "firecrawl: exhausted retries")
}

type FirecrawlMetadata = {
  title?: string | null
  ogTitle?: string | null
  description?: string | null
  ogImage?: string | null
  sourceURL?: string | null
  url?: string | null
}

type FirecrawlScrapeResponse = {
  success?: boolean
  error?: string
  data?: {
    markdown?: string
    metadata?: FirecrawlMetadata
  }
}

function pickTitle(meta: FirecrawlMetadata): string | null {
  const t = (meta.title ?? meta.ogTitle ?? "").trim()
  return t.length > 0 ? t : null
}

// Pull a plausible title out of the cleaned article body so we can give
// the source a sensible title even when the scraper's metadata didn't
// include one. Prefers a `#` heading; falls back to the first non-empty
// line if it looks like a title (short, single line, no terminal period).
function extractFirstHeading(markdown: string): string | null {
  const lines = markdown.split("\n")
  for (const line of lines) {
    const m = line.match(/^\s{0,3}#{1,3}\s+(.+?)\s*#*\s*$/)
    if (m) {
      const heading = m[1]!.trim()
      if (heading.length > 0) return heading
    }
  }
  for (const line of lines.slice(0, 3)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const stripped = trimmed
      .replace(/^[*_>\s-]+/, "")
      .replace(/[*_]+$/, "")
      .trim()
    if (stripped.length === 0 || stripped.length > 200) return null
    if (/[.!?]\s*$/.test(stripped)) return null
    return stripped
  }
  return null
}

function backoffDelayMs(attempt: number): number {
  return Math.min(5000, 1000 * 2 ** (attempt - 1))
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function safeReadDetail(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: unknown; message?: unknown }
    if (typeof j.error === "string") return j.error
    if (typeof j.message === "string") return j.message
    return `firecrawl ${res.status}`
  } catch {
    return `firecrawl ${res.status}`
  }
}

let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (openaiClient) return openaiClient
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY not set")
  openaiClient = new OpenAI({ apiKey })
  return openaiClient
}

const CLEAN_SYSTEM_PROMPT = `You are a markdown cleaner for blog posts scraped from the web. The input is one article's markdown mixed with site chrome from the publisher (Medium, Substack, news sites, etc.). Strip the chrome aggressively and return ONLY the article body.

REMOVE (these are site chrome, not content):
- Sitemap, navigation links, breadcrumbs, sidebars, mobile-menu items
- "Sign up", "Sign in", "Log in", "Open in app", "Get app", "Write", "Search" prompts
- "Follow", "Following", "Subscribe" buttons and follower / subscriber counts (e.g. "183K followers", "456K followers", "1 following")
- Reading-time stamps ("11 min read", "5 min read")
- Publication date stamps that appear as standalone metadata lines ("Feb 13, 2026", "· Last published 2 days ago")
- Clap / heart counts and comment counts that appear as bare numbers next to a Share row (e.g. a line that's just "352" or "5")
- "Share", "Copy link", social share rows, app-store badges
- Bullet / dot separator characters that decorate chrome lines: ·, |, •
- Image-widget chrome: "Press enter or click to view image in full size", "Tap to expand", "Zoom in", trailing "see" / "See" stubs near images
- Author / publication bio cards that repeat after the body ("Written by X · 456K followers · …")
- "Published in <Publication>", "<Publication> · Follow publication", "Last published X ago" headers
- Footer link lists: Help, Status, About, Careers, Press, Blog, Privacy, Rules, Terms, Text to speech, reCAPTCHA, "Recaptcha requires verification", "protected by reCAPTCHA"
- Cookie banners, GDPR notices, paywall prompts, "Member-only story" tags

KEEP (this is the article):
- The article's title — output it as a single \`# \` heading on the very first non-empty line of your output, even if the input didn't mark it as a heading
- The author byline when it appears once near the top as part of the article (e.g. "Baolin Li, Lingyi Liu, Binh Tang, Shaojing Li" or "By <Name>") — keep it as a single plain line right after the title
- Every body paragraph, heading, list, code block, blockquote, table, inline link, and image VERBATIM
- Image markdown (\`![alt](url)\`) and figure captions that describe the image (but not chrome like "Press enter to view")

RULES:
- Do NOT rewrite, summarize, translate, paraphrase, fix typos, reorder, condense, or "improve" any content.
- Do NOT add any commentary, preface, ellipsis, or trailing note of your own.
- Do NOT wrap the entire response in a markdown code fence.
- Output raw markdown only.`

const MIN_LENGTH_TO_CLEAN = 200
const MIN_KEEP_RATIO = 0.2

export async function cleanArticleMarkdown(markdown: string): Promise<string> {
  if (process.env.ENABLE_ARTICLE_CLEANUP === "0") return markdown
  if (!process.env.OPENAI_API_KEY) return markdown

  const trimmed = markdown.trim()
  if (trimmed.length < MIN_LENGTH_TO_CLEAN) return trimmed

  const model = process.env.ARTICLE_CLEAN_MODEL ?? "gpt-4o-mini"

  try {
    const res = await getOpenAI().chat.completions.create({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: CLEAN_SYSTEM_PROMPT },
        { role: "user", content: trimmed },
      ],
    })
    const cleaned = res.choices[0]?.message?.content?.trim() ?? ""
    if (!cleaned) return trimmed
    // Defensive: if the model nuked >80% of the content on a non-trivial
    // article, treat it as a misfire and keep the raw markdown so we
    // don't silently lose the article body.
    if (trimmed.length > 1000 && cleaned.length < trimmed.length * MIN_KEEP_RATIO) {
      console.warn(
        `[article] cleanup output suspiciously short (${cleaned.length}/${trimmed.length}); keeping raw`,
      )
      return trimmed
    }
    return stripWrappingCodeFence(cleaned)
  } catch (err) {
    console.warn("[article] cleanup failed, keeping raw markdown:", err)
    return trimmed
  }
}

// Some models occasionally wrap their entire response in a ```markdown
// code fence despite the prompt asking otherwise — strip that one layer.
function stripWrappingCodeFence(text: string): string {
  const m = text.match(/^```(?:markdown)?\s*\n([\s\S]*?)\n```\s*$/i)
  return m ? m[1]!.trim() : text
}
