"use client"

import { cn } from "@workspace/ui/lib/utils"

import "./podcast-wave.css"

// Waveform bar heights (in %) - a fixed sampled "audio" shape. Rendered twice:
// once as the muted base track and once as the coloured "played" overlay that
// the moving playhead reveals from left to right.
const WAVE = [
  28, 46, 62, 40, 74, 92, 58, 36, 68, 88, 100, 72, 50, 30, 54, 80,
  96, 64, 42, 70, 86, 52, 34, 60, 78, 44, 66, 90, 56, 38, 72, 48,
]

export function PodcastWave({
  active,
  className,
}: {
  active?: boolean
  className?: string
}) {
  return (
    <div className={cn("podcast-wave-demo", className)}>
      <div
        className={cn("podcast-wave-card", active && "is-playing")}
        role="group"
        aria-label="Podcast episode preview"
      >
        {/* Header: title + description on the left, mic on the right */}
        <div className="podcast-wave-head">
          <div className="podcast-wave-meta">
            <span className="podcast-wave-title">CRISPR: Editing Life</span>
            <span className="podcast-wave-desc">
              How a bacterial immune system became a tool for rewriting DNA.
            </span>
          </div>

          <span className="podcast-wave-mic-wrap" aria-hidden>
            <svg className="podcast-wave-mic" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
              <path
                d="M6 11a6 6 0 0 0 12 0M12 17v4M8.5 21h7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>

        {/* Waveform seek bar with a moving playhead */}
        <div className="podcast-wave-seek" aria-hidden>
          <div className="podcast-wave-track podcast-wave-track--base">
            {WAVE.map((h, i) => (
              <span
                key={`base-${i}`}
                className="podcast-wave-bar"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="podcast-wave-track podcast-wave-track--played">
            <div className="podcast-wave-track-inner">
              {WAVE.map((h, i) => (
                <span
                  key={`played-${i}`}
                  className="podcast-wave-bar"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
          <span className="podcast-wave-playhead" />
        </div>

        <div className="podcast-wave-times" aria-hidden>
          <span className="podcast-wave-elapsed">12:18</span>
          <span>38:00</span>
        </div>
      </div>
    </div>
  )
}
