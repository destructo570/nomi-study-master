export function extractTxtText(buffer: Buffer): string {
  const str = buffer.toString("utf8")
  return str.charCodeAt(0) === 0xfeff ? str.slice(1).trim() : str.trim()
}
