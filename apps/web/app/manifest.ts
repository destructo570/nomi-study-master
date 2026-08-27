import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "nomi - The #1 AI study assistant for students",
    short_name: "nomi",
    description:
      "The #1 AI study assistant for students - turn your lectures, PDFs, and articles into summaries, notes, flashcards, and quizzes in seconds.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    orientation: "portrait",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icons/nomi-logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  }
}
