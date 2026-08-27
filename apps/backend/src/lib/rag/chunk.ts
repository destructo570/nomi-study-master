import type {
  PdfBlock,
  PdfParseResult,
} from "../extract/pdf-parser-service"

export type Chunk = {
  page: number
  ord: number
  text: string
  tokenCount: number
}

const TARGET_TOKENS = 600
const OVERLAP_TOKENS = 80
const MIN_CHARS = 40

const CHARS_PER_TOKEN = 4

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

export function cleanText(text: string): string {
  return text
    .replace(/-\n/g, "")
    .replace(/(?<!\n)\n(?=[a-z])/g, " ")
}

function blocksToText(blocks: PdfBlock[]): string {
  const parts: string[] = []
  for (const b of blocks) {
    const text = cleanText(b.text).trim()
    if (!text) continue
    parts.push(b.type === "heading" ? `## ${text}` : text)
  }
  return parts.join("\n\n")
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
}

function splitSentences(paragraph: string): string[] {
  const out: string[] = []
  const re = /[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g
  let m: RegExpExecArray | null
  while ((m = re.exec(paragraph)) !== null) {
    const s = m[0].trim()
    if (s) out.push(s)
  }
  return out.length > 0 ? out : [paragraph]
}

function packPage(pageText: string): string[] {
  const targetChars = TARGET_TOKENS * CHARS_PER_TOKEN
  const overlapChars = OVERLAP_TOKENS * CHARS_PER_TOKEN

  const paragraphs = splitParagraphs(pageText)
  const units: string[] = []
  for (const p of paragraphs) {
    if (p.length <= targetChars) {
      units.push(p)
      continue
    }
    for (const s of splitSentences(p)) {
      if (s.length <= targetChars) {
        units.push(s)
      } else {
        for (let i = 0; i < s.length; i += targetChars) {
          units.push(s.slice(i, i + targetChars))
        }
      }
    }
  }

  const chunks: string[] = []
  let buf = ""
  for (const unit of units) {
    if (!buf) {
      buf = unit
      continue
    }
    if (buf.length + 2 + unit.length <= targetChars) {
      buf += `\n\n${unit}`
      continue
    }
    chunks.push(buf)
    const tail = buf.slice(Math.max(0, buf.length - overlapChars))
    buf = `${tail}\n\n${unit}`
  }
  if (buf) chunks.push(buf)
  return chunks
}

export function chunkPdfStructured(structured: PdfParseResult): Chunk[] {
  const out: Chunk[] = []
  for (const page of structured.pages) {
    const pageText = blocksToText(page.blocks)
    if (!pageText) continue
    const pieces = packPage(pageText)
    let ord = 0
    for (const piece of pieces) {
      const text = piece.trim()
      if (text.length < MIN_CHARS) continue
      out.push({
        page: page.page,
        ord: ord++,
        text,
        tokenCount: estimateTokens(text),
      })
    }
  }
  return out
}

const CHUNKS_PER_PSEUDO_PAGE = 5

export function chunkPlainText(text: string): Chunk[] {
  const trimmed = cleanText(text).trim()
  if (!trimmed) return []
  const pieces = packPage(trimmed)
  const out: Chunk[] = []
  let globalIdx = 0
  for (const piece of pieces) {
    const pieceText = piece.trim()
    if (pieceText.length < MIN_CHARS) continue
    out.push({
      page: Math.floor(globalIdx / CHUNKS_PER_PSEUDO_PAGE) + 1,
      ord: globalIdx % CHUNKS_PER_PSEUDO_PAGE,
      text: pieceText,
      tokenCount: estimateTokens(pieceText),
    })
    globalIdx++
  }
  return out
}
