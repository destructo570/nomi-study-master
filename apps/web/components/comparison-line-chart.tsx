"use client"

import { motion } from "framer-motion"

const CHART_W = 440
const CHART_H = 240
const PAD_L = 48
const PAD_R = 72
const PAD_T = 48
const PAD_B = 34
const PLOT_W = CHART_W - PAD_L - PAD_R
const PLOT_H = CHART_H - PAD_T - PAD_B

const WEEKS = ["Week 1", "Week 2", "Week 3", "Week 4"]
const OTHER_STUDENTS = [0, 2, 3.5, 5]
const YOU = [0, 4, 7.5, 10]

type Point = { x: number; y: number }

function scaleY(v: number, min: number, max: number) {
  return PAD_T + PLOT_H * (1 - (v - min) / (max - min))
}

function scaleX(i: number) {
  return PAD_L + (i / (WEEKS.length - 1)) * PLOT_W
}

function bottomY() {
  return PAD_T + PLOT_H
}

function toPoints(values: number[], min: number, max: number): Point[] {
  return values.map((v, i) => ({ x: scaleX(i), y: scaleY(v, min, max) }))
}

function smoothCurve(values: number[], min: number, max: number): string {
  const pts = toPoints(values, min, max)
  if (pts.length < 2) return ""
  if (pts.length === 2) return `M ${pts[0]!.x} ${pts[0]!.y} L ${pts[1]!.x} ${pts[1]!.y}`

  let d = `M ${pts[0]!.x} ${pts[0]!.y}`

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1]!
    const p1 = pts[i]!
    const p2 = pts[i + 1]!
    const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1]!

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }

  return d
}

function areaPath(values: number[], min: number, max: number): string {
  const curve = smoothCurve(values, min, max)
  const b = bottomY()
  const lastX = scaleX(values.length - 1)
  const firstX = scaleX(0)
  return `${curve} L ${lastX} ${b} L ${firstX} ${b} Z`
}

export function ComparisonLineChart() {
  const yMin = 0
  const yMax = 10
  const yTicks = [0, 2, 4, 6, 8, 10]

  return (
    <div className="w-full max-w-md mx-auto">
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full h-auto">
        <defs>
          <filter id="label-shadow" x="-20%" y="0%" width="140%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.07" />
          </filter>
          <linearGradient id="grad-gray" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a0a0a0" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#a0a0a0" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="grad-blue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={PAD_L}
              x2={CHART_W - PAD_R}
              y1={scaleY(t, yMin, yMax)}
              y2={scaleY(t, yMin, yMax)}
              stroke="currentColor"
              className="text-border"
              strokeWidth={0.5}
              strokeDasharray="4 4"
            />
            <text
              x={PAD_L - 8}
              y={scaleY(t, yMin, yMax) + 4}
              textAnchor="end"
              className="fill-muted-foreground"
              fontSize={9}
            >
              {t}
            </text>
          </g>
        ))}

        {/* X axis labels */}
        {WEEKS.map((w, i) => (
          <text
            key={w}
            x={scaleX(i)}
            y={CHART_H - 4}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={9}
          >
            {w}
          </text>
        ))}

        {/* Other students area */}
        <motion.path
          d={areaPath(OTHER_STUDENTS, yMin, yMax)}
          fill="url(#grad-gray)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        />

        {/* Other students line */}
        <motion.path
          d={smoothCurve(OTHER_STUDENTS, yMin, yMax)}
          fill="none"
          stroke="#a0a0a0"
          strokeWidth={4}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, delay: 0.3, ease: "easeInOut" }}
        />
        <motion.circle
          cx={scaleX(OTHER_STUDENTS.length - 1)}
          cy={scaleY(OTHER_STUDENTS[OTHER_STUDENTS.length - 1]!, yMin, yMax)}
          r={4}
          fill="#a0a0a0"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.4 }}
        />

        {/* You area */}
        <motion.path
          d={areaPath(YOU, yMin, yMax)}
          fill="url(#grad-blue)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        />

        {/* You line */}
        <motion.path
          d={smoothCurve(YOU, yMin, yMax)}
          fill="none"
          stroke="#2563eb"
          strokeWidth={4}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, delay: 0.9, ease: "easeInOut" }}
        />
        <motion.circle
          cx={scaleX(YOU.length - 1)}
          cy={scaleY(YOU[YOU.length - 1]!, yMin, yMax)}
          r={4}
          fill="#2563eb"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.4 }}
        />

        {/* Labels on top */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          <rect
            x={scaleX(OTHER_STUDENTS.length - 1) - 48}
            y={scaleY(OTHER_STUDENTS[OTHER_STUDENTS.length - 1]!, yMin, yMax) - 45}
            width={96}
            height={36}
            rx={18}
            fill="#ffffff"
            stroke="#f0f0f0"
            strokeWidth={1}
            filter="url(#label-shadow)"
          />
          <text
            x={scaleX(OTHER_STUDENTS.length - 1)}
            y={scaleY(OTHER_STUDENTS[OTHER_STUDENTS.length - 1]!, yMin, yMax) - 22}
            textAnchor="middle"
            fill="#a0a0a0"
            fontSize={16}
            fontWeight={500}
          >
            🥲 Others
          </text>
        </motion.g>
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          <rect
            x={scaleX(YOU.length - 1) - 36}
            y={scaleY(YOU[YOU.length - 1]!, yMin, yMax) - 45}
            width={72}
            height={36}
            rx={18}
            fill="#ffffff"
            stroke="#f0f0f0"
            strokeWidth={1}
            filter="url(#label-shadow)"
          />
          <text
            x={scaleX(YOU.length - 1)}
            y={scaleY(YOU[YOU.length - 1]!, yMin, yMax) - 22}
            textAnchor="middle"
            fill="#2563eb"
            fontSize={16}
            fontWeight={500}
          >
            🤩 You
          </text>
        </motion.g>
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-[#2563eb]" />
          <span className="text-[10px] text-muted-foreground">You</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-[#a0a0a0]" />
          <span className="text-[10px] text-muted-foreground">Other students</span>
        </div>
      </div>

      <p className="text-sm text-foreground text-center mt-3 leading-relaxed font-medium">
        You learn up to 2&times; faster<br />compared to traditional study methods.
      </p>
    </div>
  )
}
