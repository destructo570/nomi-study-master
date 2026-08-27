import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { common, createLowlight } from "lowlight"

// One lowlight registry shared across every TipTap editor. `common` covers ~35
// high-traffic languages (js, ts, py, go, rust, sql, json, bash, md, …) -
// enough for what users paste into notebooks without shipping the full ~180.
const lowlight = createLowlight(common)

/**
 * Pre-configured CodeBlockLowlight extension. When using this, configure
 * StarterKit with `codeBlock: false` so this owns the schema slot.
 */
export const CodeBlockExtension = CodeBlockLowlight.configure({
  lowlight,
  defaultLanguage: null,
  HTMLAttributes: {
    spellcheck: "false",
  },
})
