import { Hono } from "hono"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

import type { SourceType, TutorPreset } from "@workspace/types"
import { getLanguage } from "@workspace/types/language"

import type { AppEnv } from "../types"
import { buildSystemPrompt, TUTOR_PRESETS } from "../lib/ai/presets"
import { capture, captureException } from "../lib/posthog"
import { withQuota } from "../lib/quota"

const router = new Hono<AppEnv>()

const bodySchema = z.object({
  source: z.object({
    type: z.enum(["text", "youtube", "file"]),
    title: z.string().min(1),
    content: z.string().min(1),
  }),
  tutorPreset: z.enum(["eli5", "academic", "socratic"]),
  customPrompt: z.string().optional(),
  titleHint: z.string().optional(),
  language: z.string().min(2).max(8).optional(),
})

const courseSchema = z.object({
  title: z.string(),
  chapters: z
    .array(z.object({ title: z.string(), markdown: z.string() }))
    .min(3)
    .max(8),
})

type Course = z.infer<typeof courseSchema>

function mockCourse(
  source: { type: SourceType; title: string; content: string },
  preset: TutorPreset,
  titleHint?: string,
): Course {
  const title = titleHint?.trim() || source.title
  const preface = TUTOR_PRESETS[preset].tagline
  const sourceLabel: Record<SourceType, string> = {
    text: "your text",
    youtube: "the video",
    article: "the article",
    file: "the file",
  }
  const src = sourceLabel[source.type]
  return {
    title,
    chapters: [
      {
        title: `Welcome to ${title}`,
        markdown: `# Welcome to ${title}\n\n> ${preface}\n\nIn this course we'll unpack ${title.toLowerCase()} using ${src} as our guide. Grab a coffee — this first chapter is just a warm-up.\n\n## What you'll take away\n\n- A mental model for the big idea.\n- The 3 most important sub-concepts.\n- A few examples you can explain to a friend.\n\n> **Recap:** ${title} is about to make a lot more sense.`,
      },
      {
        title: "Core ideas",
        markdown: `# Core ideas\n\nEvery topic has a few **load-bearing ideas**. For ${title.toLowerCase()}, here are three that do most of the work.\n\n1. **Idea one** — the foundation the rest of the course rests on.\n2. **Idea two** — a surprising twist you might not expect.\n3. **Idea three** — the practical consequence you'll actually use.\n\n## Worked example\n\nPicture a small scenario drawn from ${src}. Walk through each of the three ideas and note how they combine.\n\n> **Recap:** three ideas, one topic, many applications.`,
      },
      {
        title: "Mechanisms and details",
        markdown: `# Mechanisms and details\n\nNow we zoom in. How does ${title.toLowerCase()} actually *work* step by step?\n\n\`\`\`\nStep 1 → Step 2 → Step 3 → Outcome\n\`\`\`\n\n- **Step 1:** the setup.\n- **Step 2:** the transformation where the magic happens.\n- **Step 3:** the payoff — what you see on the outside.\n\n## Common pitfalls\n\n- Skipping step 2 and expecting step 3 to work.\n- Confusing the outcome with the process.\n\n> **Recap:** three steps, one pipeline.`,
      },
      {
        title: "Putting it to work",
        markdown: `# Putting it to work\n\nThis chapter is the *so what*. How do you use ${title.toLowerCase()} outside of theory?\n\n## Three scenarios\n\n- **Quick hit:** a 5-minute application you can try today.\n- **Medium dive:** a weekend project that uses the core ideas.\n- **Deep integration:** how real teams bake ${title.toLowerCase()} into their work.\n\n## Your next action\n\nPick one scenario, write a single sentence about how you'd apply it, and revisit it in a week.\n\n> **Recap:** theory is cute, shipping is better.`,
      },
    ],
  }
}

router.post("/", async (c) => {
  const parsed = bodySchema.parse(await c.req.json())
  const { source, tutorPreset, customPrompt, titleHint } = parsed
  const language = parsed.language ?? c.get("userLanguage")

  if (!process.env.OPENAI_API_KEY) {
    capture({
      distinctId: c.get("userId"),
      event: "course_generated",
      properties: {
        mocked: true,
        source_type: source.type,
        source_length: source.content.length,
        tutor_preset: tutorPreset,
        has_custom_prompt: !!customPrompt,
        plan: c.get("userPlan"),
      },
    })
    return c.json({
      mocked: true,
      course: mockCourse(source, tutorPreset, titleHint),
    })
  }

  return await withQuota(c, "course.generate", async () => {
    try {
      const system = buildSystemPrompt(
        tutorPreset,
        customPrompt,
        getLanguage(language).name,
      )
      const userPrompt = [
        titleHint ? `Suggested title: ${titleHint}` : undefined,
        `Source type: ${source.type}`,
        `Source title: ${source.title}`,
        "",
        "Source content:",
        source.content.slice(0, 12_000),
      ]
        .filter(Boolean)
        .join("\n")

      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: courseSchema,
        system,
        prompt: userPrompt,
        // 8 chapters × ~800 tokens ≈ 6400; cap at 8000 with headroom.
        maxOutputTokens: 8000,
      })

      capture({
        distinctId: c.get("userId"),
        event: "course_generated",
        properties: {
          mocked: false,
          source_type: source.type,
          source_length: source.content.length,
          tutor_preset: tutorPreset,
          has_custom_prompt: !!customPrompt,
          chapter_count: object.chapters.length,
          plan: c.get("userPlan"),
        },
      })

      return c.json({ mocked: false, course: object })
    } catch (err) {
      console.error("[generate-course] AI generation failed:", err)
      captureException(err, c.get("userId"))
      throw err
    }
  })
})

export default router
