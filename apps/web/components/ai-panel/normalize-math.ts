/**
 * Normalize LaTeX math delimiters produced by LLMs into the `$...$` /
 * `$$...$$` forms that `remark-math` understands.
 *
 * Why: most chat models emit TeX-style delimiters — inline `\( ... \)` and
 * display `\[ ... \]`. `remark-math` only parses dollar delimiters, so those
 * arrive in the chat as raw escaped text. We rewrite them on the client so
 * both live-streamed and persisted messages render correctly, regardless of
 * which delimiter style the model happened to use.
 *
 * Code regions are protected: fenced code blocks (``` / ~~~) and inline code
 * (`...`) are passed through untouched, so delimiters inside code samples are
 * never altered.
 */

type Segment = { text: string; code: boolean }

/**
 * Split markdown into alternating non-code / code segments so delimiter
 * rewriting can skip over code blocks and inline code.
 */
function splitCodeSegments(markdown: string): Segment[] {
  const segments: Segment[] = []
  let i = 0
  const len = markdown.length

  while (i < len) {
    // Detect a fenced code block at the start of a line.
    const fenceMatch = /^(`{3,}|~{3,}).*[^\n]*\n/.exec(markdown.slice(i))
    if (fenceMatch) {
      const fenceRun = fenceMatch[1] ?? ""
      const fence = fenceRun[0] ?? ""
      const fenceLen = fenceRun.length
      const opener = fenceMatch[0]
      // Find the matching closing fence on its own line.
      const rest = markdown.slice(i + opener.length)
      const closer = new RegExp(
        `(^|\n)[ \t]*${fence}{${fenceLen},}[ \t]*($|\n)`,
      ).exec(rest)
      if (closer) {
        const end =
          i + opener.length + closer.index + closer[0].length
        segments.push({ text: markdown.slice(i, end), code: true })
        i = end
        continue
      }
    }

    // Otherwise consume up to the next inline-code backtick or fenced block.
    let next = i
    let chunk = ""
    while (next < len) {
      const char = markdown[next]
      // Potential fenced block at a line start.
      if (
        (char === "`" || char === "~") &&
        (next === 0 || markdown[next - 1] === "\n")
      ) {
        const run = /^(`{3,}|~{3,})/.exec(markdown.slice(next))
        if (run) break
      }
      // Inline code span.
      if (char === "`") break

      chunk += char
      next++
    }

    if (next === i) {
      // We're sitting on a backtick run — consume it as inline code.
      const run = /^`+/ /* .exec */.exec(markdown.slice(i))!
      const ticks = run[0]
      const after = markdown.slice(i + ticks.length)
      const closeIdx = after.indexOf(ticks)
      if (closeIdx !== -1) {
        const end = i + ticks.length + closeIdx + ticks.length
        segments.push({ text: markdown.slice(i, end), code: true })
        i = end
      } else {
        // Unmatched backtick — treat literally, advance one char.
        segments.push({ text: markdown.slice(i, i + 1), code: false })
        i++
      }
    } else {
      segments.push({ text: chunk, code: false })
      i = next
    }
  }

  return segments
}

/**
 * Rewrite `\( ... \)` -> `$...$` and `\[ ... \]` -> `$$...$$` within a single
 * text segment. Display math is collapsed to a single line so `remark-math`
 * reliably detects it as a block.
 */
function rewriteDelimiters(text: string): string {
  let out = text

  // Display math: \[ ... \]  (optionally spread across lines)
  out = out.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (_m, body: string) => `$$${body.trim()}$$`,
  )
  // Inline math: \( ... \)
  out = out.replace(
    /\\\(([\s\S]*?)\\\)/g,
    (_m, body: string) => `$${body.trim()}$`,
  )

  return out
}

/**
 * Normalize math delimiters across a full markdown string, preserving code.
 */
export function normalizeMathDelimiters(markdown: string): string {
  if (!markdown) return markdown
  const segments = splitCodeSegments(markdown)
  return segments
    .map((seg) => (seg.code ? seg.text : rewriteDelimiters(seg.text)))
    .join("")
}
