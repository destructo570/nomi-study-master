import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt =
  "nomi - The #1 AI study assistant for students"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#ffffff",
          color: "#000000",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            fontWeight: 400,
            color: "#777169",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 9999,
              background: "#000000",
            }}
          />
          nomistudy.com
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 88,
              fontWeight: 300,
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
              color: "#000000",
              maxWidth: 1000,
            }}
          >
            The #1 AI study assistant for students.
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 400,
              lineHeight: 1.35,
              color: "#777169",
              maxWidth: 980,
            }}
          >
            Turn lectures, PDFs, and articles into summaries, notes,
            flashcards, and quizzes in seconds.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 22,
            color: "#777169",
          }}
        >
          <div style={{ display: "flex", gap: 28 }}>
            <span>Summaries</span>
            <span>·</span>
            <span>Flashcards</span>
            <span>·</span>
            <span>Quizzes</span>
            <span>·</span>
            <span>AI tutor</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 24px",
              borderRadius: 9999,
              background: "#000000",
              color: "#ffffff",
              fontSize: 22,
              fontWeight: 500,
            }}
          >
            Start free
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
