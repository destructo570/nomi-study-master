"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "@workspace/ui/lib/utils"

import "./ai-chat.css"

type Token =
  | { t: "text"; v: string }
  | { t: "eq"; v: string }
  | { t: "frac"; num: string; den: string }
  | { t: "br" }

// The streamed answer, broken into small tokens so it reveals like an LLM.
const ANSWER: Token[] = [
  { t: "text", v: "Using the quadratic formula " },
  { t: "frac", num: "−b ± √(b² − 4ac)", den: "2a" },
  { t: "text", v: " with " },
  { t: "eq", v: "a = 1, b = −5, c = 6" },
  { t: "text", v: ":" },
  { t: "br" },
  { t: "eq", v: "x = (5 ± √(25 − 24)) ⁄ 2 = (5 ± 1) ⁄ 2" },
  { t: "br" },
  { t: "text", v: "So the roots are " },
  { t: "eq", v: "x = 3" },
  { t: "text", v: " and " },
  { t: "eq", v: "x = 2" },
  { t: "text", v: "." },
]

const THINK_MS = 1100
const STREAM_MS = 190

function renderToken(tok: Token, i: number) {
  if (tok.t === "br") return <br key={i} />
  if (tok.t === "eq")
    return (
      <span key={i} className="aic-tok aic-eq">
        {tok.v}
      </span>
    )
  if (tok.t === "frac")
    return (
      <span key={i} className="aic-tok aic-frac">
        <span className="aic-frac-num">{tok.num}</span>
        <span className="aic-frac-den">{tok.den}</span>
      </span>
    )
  return (
    <span key={i} className="aic-tok">
      {tok.v}
    </span>
  )
}

type Phase = "idle" | "thinking" | "streaming" | "done"

export function AiChat({
  active,
  className,
}: {
  active?: boolean
  className?: string
}) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [count, setCount] = useState(0)
  const timers = useRef<number[]>([])
  const ctlRef = useRef<{ start: () => void; stop: () => void } | null>(null)

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  const start = () => {
    clearTimers()
    setCount(0)
    setPhase("thinking")
    const think = window.setTimeout(() => {
      setPhase("streaming")
      ANSWER.forEach((_, i) => {
        const t = window.setTimeout(() => {
          setCount(i + 1)
          if (i === ANSWER.length - 1) setPhase("done")
        }, i * STREAM_MS)
        timers.current.push(t)
      })
    }, THINK_MS)
    timers.current.push(think)
  }

  const stop = () => {
    clearTimers()
    setPhase("idle")
    setCount(0)
  }

  ctlRef.current = { start, stop }

  // Drive the animation from the FeatureCard hover state.
  useEffect(() => {
    if (active) ctlRef.current?.start()
    else ctlRef.current?.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  // Clean up any pending timers on unmount.
  useEffect(() => () => clearTimers(), [])

  const showThinking = phase === "idle" || phase === "thinking"

  return (
    <div className={cn("aic-demo", className)}>
      <div
        className="aic-chat"
        role="group"
        aria-label="AI chat - hover to ask a maths question and watch the answer stream in"
      >
        {/* User question - right aligned, two lines */}
        <div className="aic-row aic-row--user">
          <div className="aic-bubble aic-bubble--user">
            Solve <span className="aic-eq">x² − 5x + 6 = 0</span> and show the
            roots using the quadratic formula.
          </div>
        </div>

        {/* Assistant - left aligned */}
        <div className="aic-row aic-row--ai">
          <div className="aic-bubble aic-bubble--ai">
            {showThinking ? (
              <span
                className={cn(
                  "aic-thinking",
                  phase === "thinking" && "is-animating",
                )}
              >
                Thinking
                <i className="aic-dot" />
                <i className="aic-dot" />
                <i className="aic-dot" />
              </span>
            ) : (
              <span className="aic-answer">
                {ANSWER.slice(0, count).map(renderToken)}
                {phase === "streaming" && <span className="aic-caret" />}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
