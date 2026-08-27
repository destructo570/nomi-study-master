import { join } from "node:path"

export type PdfBlock = {
  type: "heading" | "paragraph"
  text: string
  bbox: [number, number, number, number] | null
}

export type PdfPage = {
  page: number
  blocks: PdfBlock[]
}

export type PdfParseResult = {
  pageCount: number
  needsOCR: boolean
  pages: PdfPage[]
}

const SCRIPT_PATH = join(import.meta.dir, "pdf_parser.py")
const DEFAULT_TIMEOUT_MS = 120_000

async function resolvePythonBin(): Promise<string> {
  const explicit = process.env.PDF_PARSER_PYTHON
  if (explicit) {
    const f = Bun.file(explicit)
    if (await f.exists()) return explicit
    console.warn(
      `PDF_PARSER_PYTHON "${explicit}" not found, falling back to "python3"`,
    )
  }
  return "python3"
}

export class PdfParserService {
  static async parse(
    filePath: string,
    opts?: { timeoutMs?: number },
  ): Promise<PdfParseResult> {
    const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS
    const pythonBin = await resolvePythonBin()

    const proc = Bun.spawn([pythonBin, SCRIPT_PATH, filePath], {
      stdout: "pipe",
      stderr: "pipe",
    })

    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      proc.kill()
    }, timeoutMs)

    let exitCode: number
    try {
      exitCode = await proc.exited
    } finally {
      clearTimeout(timer)
    }

    if (timedOut) {
      throw new Error(
        `PDF parsing timed out after ${Math.round(timeoutMs / 1000)}s`,
      )
    }

    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text()
      throw new Error(
        `PDF parser exited with code ${exitCode}: ${stderr.trim() || "no error output"}`,
      )
    }

    const stdout = await new Response(proc.stdout).text()
    if (!stdout.trim()) {
      throw new Error("PDF parser produced no output")
    }

    try {
      return JSON.parse(stdout) as PdfParseResult
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new Error(`PDF parser returned invalid JSON: ${message}`)
    }
  }
}
