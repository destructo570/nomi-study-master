"use client"

import { useEffect, useRef } from "react"

import { cn } from "@workspace/ui/lib/utils"

import "./audio-recorder.css"

// A fixed sampled "audio" shape (bar heights in %). Drawn on a canvas so every
// bar is rasterised at an identical device-pixel width - div bars round to
// 3px/4px inconsistently on fractional-DPI displays, which looked uneven.
const WAVE = [
  30, 52, 38, 70, 46, 88, 60, 34, 76, 50, 92, 42, 64, 28, 80, 56,
  44, 72, 36, 60, 84, 48, 68, 32, 58, 90, 40, 74, 54, 66, 38, 82,
]

const BAR_CSS = 3 // bar width in CSS px
const PITCH_CSS = 10 // distance between bar starts in CSS px
const SPEED_CSS = 24 // leftward scroll speed in CSS px / second

export function AudioRecorder({
  active,
  className,
}: {
  active?: boolean
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Controller stored by the canvas effect; the hover effect calls into it.
  const ctlRef = useRef<{ start: () => void; stop: () => void } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches

    let dpr = 1
    let cw = 1
    let ch = 1
    let pitch = 10
    let barW = 3
    let radius = 1
    let period = 1
    let offset = 0
    let grad: CanvasGradient | null = null
    let raf = 0
    let lastT = -1
    let running = false

    const resize = () => {
      dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      cw = Math.max(1, Math.round(rect.width * dpr))
      ch = Math.max(1, Math.round(rect.height * dpr))
      canvas.width = cw
      canvas.height = ch
      // Round geometry to whole device pixels so every bar is the same width.
      pitch = Math.max(1, Math.round(PITCH_CSS * dpr))
      barW = Math.max(2, Math.round(BAR_CSS * dpr))
      radius = Math.min(Math.floor(barW / 2), Math.round(1.5 * dpr))
      period = WAVE.length * pitch
      grad = ctx.createLinearGradient(0, 0, 0, ch)
      grad.addColorStop(0, "#fb923c")
      grad.addColorStop(1, "#f97316")
      draw()
    }

    const draw = () => {
      ctx.clearRect(0, 0, cw, ch)
      const center = cw / 2
      const count = Math.ceil(cw / pitch) + 2
      const startIdx = Math.floor(offset / pitch)
      const frac = offset - startIdx * pitch
      for (let k = 0; k < count; k++) {
        const x = Math.round(k * pitch - frac) // integer px → crisp, uniform width
        let idx = (startIdx + k) % WAVE.length
        if (idx < 0) idx += WAVE.length
        const amp = WAVE[idx]! / 100
        const barH = Math.max(barW, Math.round(amp * ch * 0.92))
        const y = Math.round((ch - barH) / 2)
        // Right of the recording head = raw (grey); left = captured (orange).
        ctx.fillStyle =
          x + barW / 2 < center ? (grad as CanvasGradient) : "#c2c2cc"
        ctx.beginPath()
        const anyCtx = ctx as CanvasRenderingContext2D & {
          roundRect?: (
            x: number,
            y: number,
            w: number,
            h: number,
            r: number,
          ) => void
        }
        if (typeof anyCtx.roundRect === "function") {
          anyCtx.roundRect(x, y, barW, barH, radius)
        } else {
          ctx.rect(x, y, barW, barH)
        }
        ctx.fill()
      }
    }

    const loop = (t: number) => {
      if (lastT < 0) lastT = t
      const dt = (t - lastT) / 1000
      lastT = t
      offset = (offset + SPEED_CSS * dpr * dt) % period
      draw()
      raf = requestAnimationFrame(loop)
    }

    const start = () => {
      if (running || reduced) return
      running = true
      lastT = -1
      raf = requestAnimationFrame(loop)
    }

    const stop = () => {
      running = false
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    ctlRef.current = { start, stop }
    if (active) start()

    return () => {
      stop()
      ro.disconnect()
      ctlRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Toggle the recording animation when the FeatureCard hover state changes.
  useEffect(() => {
    ctlRef.current?.[active ? "start" : "stop"]()
  }, [active])

  return (
    <div className={cn("audio-rec-demo", className)}>
      <div
        className={cn("audio-rec-stage", active && "is-active")}
        role="img"
        aria-label="Audio recorder - raw sound enters from the right, passes the recording head, and is captured as a coloured waveform on the left"
      >
        {/* Mic */}
        <span className="audio-rec-mic-wrap" aria-hidden>
          <span className="audio-rec-mic-pulse" />
          <svg className="audio-rec-mic" viewBox="0 0 24 24" fill="none">
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

        {/* Waveform: grey raw sound on the right, orange captured on the left */}
        <div className="audio-rec-wave" aria-hidden>
          <canvas ref={canvasRef} className="audio-rec-canvas" />
          {/* Centre recording head the waves pass through */}
          <span className="audio-rec-head" />
        </div>

        <span className="audio-rec-caption" aria-hidden>
          REC
        </span>
      </div>
    </div>
  )
}
