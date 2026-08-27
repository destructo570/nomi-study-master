import "dotenv/config"

import { nanoid } from "nanoid"

import { db } from "./client"
import {
  chapters,
  chatMessages,
  exams,
  flashcards,
  notebookDocs,
  notebooks,
  quizzes,
  shelves,
  sources,
  summaries,
  users,
} from "./schema"

const EMOJI_POOL = [
  "📓", "📔", "📒", "📕", "📗", "📘", "📙",
  "🧠", "💡", "🔬", "🧪", "🔎", "🗺️", "🚀",
  "📚", "✍️", "📝", "🎯", "⭐", "🔖", "📌",
]

function pickNotebookEmoji(seed?: string): string {
  if (!seed) return EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  return EMOJI_POOL[Math.abs(hash) % EMOJI_POOL.length]!
}

const PHOTOSYNTHESIS_CHAPTERS: Array<{ title: string; markdown: string }> = [
  {
    title: "Intro to Photosynthesis",
    markdown: `# Intro to Photosynthesis

Imagine a **tiny solar kitchen** inside every green leaf. That's photosynthesis — plants cooking sugar using sunlight as the stove.

## The one-line story

Plants take water from the soil, carbon dioxide from the air, and sunlight from the sky, and turn them into glucose (plant food) and oxygen (what you're breathing right now — thanks, plants!).

\`\`\`
6 CO₂ + 6 H₂O + light → C₆H₁₂O₆ + 6 O₂
\`\`\`

## Why should I care?

- Every meal you've ever eaten started here.
- Every breath of oxygen came from this process.
- It's the reason Earth isn't a lifeless rock.

In the next chapters, we'll zoom into the **light-dependent reactions** (the solar-panel phase) and the **Calvin cycle** (the sugar-making phase).`,
  },
]

const PHOTOSYNTHESIS_SUMMARY = `# Photosynthesis — summary

Plants run a tiny solar kitchen: they use **sunlight, water, and CO₂** to cook glucose and release oxygen.
`

type SeedShelf = {
  id: string
  name: string
  notebooks: Array<{
    id: string
    title: string
    preset?: "eli5" | "academic" | "socratic"
    hasChapters?: boolean
  }>
}

const SEED_SHELVES: SeedShelf[] = [
  {
    id: "research",
    name: "Research",
    notebooks: [
      {
        id: "photosynthesis-101",
        title: "Photosynthesis 101",
        preset: "eli5",
        hasChapters: true,
      },
      { id: "llm-eval", title: "LLM Eval Notes" },
    ],
  },
  {
    id: "product",
    name: "Product",
    notebooks: [{ id: "q2-roadmap", title: "Q2 Roadmap" }],
  },
]

async function pickUserId(): Promise<string> {
  const fromEnv = process.env.SEED_USER_ID
  if (fromEnv) return fromEnv
  const rows = await db.select({ id: users.id }).from(users).limit(1)
  if (rows.length === 0) {
    throw new Error(
      "No users in DB. Sign up via the web app first, or set SEED_USER_ID env var.",
    )
  }
  return rows[0]!.id
}

async function main() {
  const userId = await pickUserId()
  console.log(`[seed] seeding for user ${userId}`)

  console.log("[seed] wiping app tables for this user…")
  await db.delete(chatMessages)
  await db.delete(exams)
  await db.delete(quizzes)
  await db.delete(flashcards)
  await db.delete(summaries)
  await db.delete(notebookDocs)
  await db.delete(chapters)
  await db.delete(sources)
  await db.delete(notebooks)
  await db.delete(shelves)

  console.log("[seed] inserting shelves…")
  await db.insert(shelves).values(
    SEED_SHELVES.map((s) => ({ id: s.id, userId, name: s.name })),
  )

  console.log("[seed] inserting notebooks + docs…")
  for (const s of SEED_SHELVES) {
    for (const n of s.notebooks) {
      await db.insert(notebooks).values({
        id: n.id,
        shelfId: s.id,
        userId,
        title: n.title,
        icon: pickNotebookEmoji(n.id),
        tutorPreset: n.preset ?? null,
      })
      await db.insert(notebookDocs).values({
        notebookId: n.id,
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: n.title }],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Start writing, or type / for commands." },
              ],
            },
          ],
        },
      })

      if (n.hasChapters) {
        await db.insert(chapters).values(
          PHOTOSYNTHESIS_CHAPTERS.map((ch, i) => ({
            id: `${n.id}-ch-${i + 1}`,
            notebookId: n.id,
            order: i,
            title: ch.title,
            markdown: ch.markdown,
          })),
        )
        await db.insert(summaries).values({
          id: nanoid(8),
          notebookId: n.id,
          depth: "normal",
          prompt: null,
          markdown: PHOTOSYNTHESIS_SUMMARY,
        })
      }
    }
  }

  console.log("[seed] done.")
  process.exit(0)
}

main().catch((err) => {
  console.error("[seed] failed:", err)
  process.exit(1)
})
