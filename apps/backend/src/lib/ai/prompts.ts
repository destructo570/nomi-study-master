import { readFileSync } from "node:fs"
import path from "node:path"

const PROMPTS_DIR = path.resolve(import.meta.dir, "../../../prompts")
const cache = new Map<string, string>()

function readPromptFile(name: string): string {
  const filePath = path.join(PROMPTS_DIR, `${name}.txt`)
  return readFileSync(filePath, "utf8").trimEnd()
}

export function loadPrompt(
  name: string,
  vars: Record<string, string | number> = {},
): string {
  let raw = cache.get(name)
  if (raw === undefined) {
    raw = readPromptFile(name)
    cache.set(name, raw)
  }
  return raw.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] !== undefined ? String(vars[key]) : "",
  )
}
