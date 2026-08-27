import Link from "next/link"

const SECTIONS = [
  {
    href: "/admin/content",
    title: "Content Engine",
    description: "Generate, score, and manage SEO pages at scale with the AI content pipeline.",
  },
  {
    href: "/admin/credits",
    title: "Credits",
    description: "Review TikTok / Reels submissions and grant credits manually.",
  },
  {
    href: "/admin/feedback",
    title: "Feedback",
    description: "Read user feedback submitted from the sidebar dialog.",
  },
  {
    href: "/admin/llm-test",
    title: "LLM Test",
    description: "Run prompts against documents, save evals to JSONL.",
  },
] as const

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-[32px] font-light tracking-[-0.02em] md:text-[36px]">
          Admin
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Internal tools. Pick a section to get started.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/40"
          >
            <h2 className="text-[15px] font-medium">{section.title}</h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              {section.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
