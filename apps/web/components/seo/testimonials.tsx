"use client"

import { cn } from "@workspace/ui/lib/utils"
import { UserAvatar } from "@/components/user-avatar"

const TESTIMONIAL_META = [
  { name: "Lin Wei", avatar: "bg-[#f4a78d]" },
  { name: "Ethan M.", avatar: "bg-[#9bb4d9]" },
  { name: "Mateo Ruiz", avatar: "bg-[#d8c19a]" },
  { name: "Camila Torres", avatar: "bg-[#a4c7b0]" },
  { name: "Wei Chen", avatar: "bg-[#c8a3c9]" },
  { name: "Leo Fischer", avatar: "bg-[#e6b07b]" },
  { name: "Maya F.", avatar: "bg-[#f0c6a8]" },
  { name: "Diego", avatar: "bg-[#b6c4e0]" },
]

const TESTIMONIALS = [
  {
    role: "Gaokao aspirant",
    headline: "Better flashcards than I'd ever make",
    quote:
      "Dumped my entire inorganic chem folder into it at 2am and somehow walked into the exam not feeling cooked. The flashcards were actually better than the ones I spent hours making myself.",
  },
  {
    role: "CS student, University of Toronto",
    headline: "No more rewatching 2 hour recordings",
    quote:
      "The lecture summary thing is lowkey insane. I stopped rewatching 2 hour recordings because it pulls out the exact stuff professors hide in between random tangents.",
  },
  {
    role: "Student",
    headline: "All my notes finally talk to each other",
    quote:
      "I had notes scattered across Notion, random PDFs, Telegram and Google Docs. Now I just throw everything here and the AI actually remembers my material when I ask questions.",
  },
  {
    role: "Student",
    headline: "Brutal in a good way",
    quote:
      "The quizzes are brutal in a good way. It keeps targeting the chapters I keep messing up instead of giving me easy confidence boost questions.",
  },
  {
    role: "High school senior, Shanghai",
    headline: "Saved my Gaokao prep",
    quote:
      "Recorded my coaching class during the metro ride home, got revision notes before dinner. Genuinely saved my Gaokao prep.",
  },
  {
    role: "Student",
    headline: "Like that smart friend who explains",
    quote:
      "Feels less like an app and more like that smart friend who explains concepts without making you feel dumb. The tutor catches gaps in my reasoning instantly.",
  },
  {
    role: "Pre-med student, UCLA",
    headline: "Wish I'd found it earlier",
    quote:
      "I used it for one week before finals and immediately regretted not finding it earlier. The AI tutor explaining stuff from my own notes changed everything.",
  },
  {
    role: "Computer science student",
    headline: "The ADHD mode is underrated",
    quote:
      "The ADHD mode is underrated. Breaking long chapters into tiny lessons + quizzes made studying feel way less exhausting.",
  },
]

const CARD_PASTELS = [
  { bg: "#fdf6f6", border: "#f3dede" },
  { bg: "#fdf9f0", border: "#eddfc4" },
  { bg: "#f8fbef", border: "#dde5c4" },
  { bg: "#f1f8f3", border: "#cee0d4" },
  { bg: "#f1f7fc", border: "#d3e2ee" },
  { bg: "#f4f3fc", border: "#dcd9ee" },
  { bg: "#fbf3f8", border: "#ead4e1" },
  { bg: "#fdf4ec", border: "#ecd5bf" },
]

export function Testimonials() {
  const items = TESTIMONIALS.map((entry, i) => ({
    ...entry,
    name: TESTIMONIAL_META[i]?.name ?? "",
    avatar: TESTIMONIAL_META[i]?.avatar ?? "bg-muted",
  }))
  return (
    <section className="px-5 pb-20 sm:px-8 sm:pb-24">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-10 flex flex-col items-center">
          <p
            className={cn(
              "font-display font-normal tracking-[-0.02em] leading-[1.08]",
              "max-w-[760px] text-center text-[28px] sm:text-[36px] md:text-[40px]"
            )}
          >
            Trusted by thousands of learners
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {items.map((it, i) => {
            const palette = CARD_PASTELS[i % CARD_PASTELS.length]!
            return (
              <figure
                key={it.name}
                className={cn(
                  "flex h-full flex-col items-center rounded-[16px] border p-6 text-center lg:col-span-2",
                  i === items.length - 2 && "lg:col-start-2"
                )}
                style={{
                  backgroundColor: palette.bg,
                  borderColor: palette.border,
                }}
              >
                <p className="text-[16px] leading-[1.35] font-medium text-foreground">
                  {it.headline}
                </p>
                <blockquote className="mt-3 text-[15px] leading-[1.6] text-muted-foreground">
                  &ldquo;{it.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-auto flex items-center justify-center gap-3 pt-6">
                  <UserAvatar name={it.name} size={40} />
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-[14px] font-medium text-foreground">
                      {it.name}
                    </span>
                    <span className="mt-0.5 text-[11px] text-muted-foreground">
                      {it.role}
                    </span>
                  </div>
                </figcaption>
              </figure>
            )
          })}
        </div>
      </div>
    </section>
  )
}
