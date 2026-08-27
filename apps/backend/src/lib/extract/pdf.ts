import { unlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { nanoid } from "nanoid"
import { pdfPageLimit } from "@workspace/types/plan"
import type { Plan } from "@workspace/types"

import {
  PdfParserService,
  type PdfBlock,
  type PdfParseResult,
} from "./pdf-parser-service"

export type PdfExtractResult = {
  markdown: string
  structured: PdfParseResult
}

export async function extractPdfText(
  buffer: Buffer,
  plan: Plan = "free",
): Promise<PdfExtractResult> {
  const tmpPath = join(tmpdir(), `arkive-pdf-${nanoid(10)}.pdf`)
  await writeFile(tmpPath, buffer)

  let result: PdfParseResult
  try {
    result = await PdfParserService.parse(tmpPath)
  } finally {
    await unlink(tmpPath).catch(() => {})
  }

  if (result.needsOCR) {
    throw new Error(
      "This PDF appears to be scanned. OCR is not yet supported — please upload a text-based PDF.",
    )
  }

  if (result.pageCount === 0) {
    throw new Error("PDF is empty.")
  }

  const pageLimit = pdfPageLimit(plan)
  if (result.pageCount > pageLimit) {
    throw new Error(
      `PDF exceeds the ${pageLimit}-page limit (${result.pageCount} pages).`,
    )
  }

  return { markdown: blocksToMarkdown(result), structured: result }
}

function blocksToMarkdown(result: PdfParseResult): string {
  const pageChunks: string[] = []
  for (const page of result.pages) {
    const parts: string[] = []
    for (const block of page.blocks) {
      parts.push(renderBlock(block))
    }
    if (parts.length > 0) {
      pageChunks.push(parts.join("\n\n"))
    }
  }
  return pageChunks.join("\n\n").trim()
}

function renderBlock(block: PdfBlock): string {
  if (block.type === "heading") return `## ${block.text}`
  return block.text
}
