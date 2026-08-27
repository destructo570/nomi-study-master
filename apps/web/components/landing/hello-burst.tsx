"use client"

import { cn } from "@workspace/ui/lib/utils"

import "./hello-burst.css"

// "Hello" in four languages, each a soft pastel, spaced evenly around the orbit.
const WORDS = [
  { t: "Hello", bg: "#ffe0ea", fg: "#d65f86", bd: "#ffd0de" },
  { t: "Hola", bg: "#fff0d6", fg: "#cf972f", bd: "#ffe6bf" },
  { t: "Bonjour", bg: "#e0ecff", fg: "#5a82c4", bd: "#d2e2ff" },
  { t: "こんにちは", bg: "#ddf5e6", fg: "#4ea876", bd: "#cdeed9" },
]

export function HelloBurst({
  active,
  className,
}: {
  active?: boolean
  className?: string
}) {
  const step = 360 / WORDS.length

  return (
    <div className={cn("hello-burst-demo", className)}>
      <div
        className={cn("hello-burst-stage", active && "is-playing")}
        role="group"
        aria-label="Supports 50+ languages"
      >
        <div className="hello-burst-orbit" aria-hidden>
          {/* Dashed circular axis the pills ride on */}
          <div className="hello-burst-axis" />

          {/* Rotating ring of greeting pills */}
          <div className="hello-burst-ring">
            {WORDS.map((w, i) => (
              <span
                className="hello-burst-chip"
                key={w.t}
                style={{ ["--a" as string]: `${i * step + 45}deg` }}
              >
                <span
                  className="hello-burst-pill"
                  style={{
                    ["--bg" as string]: w.bg,
                    ["--fg" as string]: w.fg,
                    ["--bd" as string]: w.bd,
                  }}
                >
                  {w.t}
                </span>
              </span>
            ))}
          </div>

          {/* Center globe */}
          <span className="hello-burst-globe" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="9.5" />
              <ellipse cx="12" cy="12" rx="4" ry="9.5" />
              <path d="M2.5 12h19M4 7h16M4 17h16" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  )
}
