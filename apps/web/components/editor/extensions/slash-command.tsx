"use client"

import { Extension } from "@tiptap/core"
import { PluginKey } from "@tiptap/pm/state"
import Suggestion from "@tiptap/suggestion"
import type { Editor, Range } from "@tiptap/core"
import { createRoot, type Root } from "react-dom/client"

import { SlashMenu, type SlashItem } from "../slash-menu"
import { slashItems } from "../slash-items"

export const slashCommandPluginKey = new PluginKey("slashCommand")

export const SlashCommandExtension = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      items: slashItems as SlashItem[],
      suggestion: {
        char: "/",
        startOfLine: false,
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor
          range: Range
          props: SlashItem
        }) => {
          props.run(editor, range)
        },
      },
    }
  },

  addProseMirrorPlugins() {
    const availableItems = this.options.items as SlashItem[]
    return [
      Suggestion({
        editor: this.editor,
        pluginKey: slashCommandPluginKey,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => {
          const q = query.toLowerCase()
          return availableItems.filter(
            (i) =>
              i.title.toLowerCase().includes(q) ||
              i.keywords?.some((k) => k.toLowerCase().includes(q)),
          )
        },
        render: () => {
          let container: HTMLDivElement | null = null
          let root: Root | null = null
          let selectedIndex = 0
          let currentItems: SlashItem[] = []
          let commandFn: ((item: SlashItem) => void) | null = null

          function unmount() {
            if (root) root.unmount()
            container?.remove()
            container = null
            root = null
          }

          type RenderProps = {
            items: SlashItem[]
            command: (item: SlashItem) => void
            clientRect?: (() => DOMRect | null) | null
          }

          function render(props: RenderProps) {
            currentItems = props.items
            commandFn = props.command
            if (!container) {
              container = document.createElement("div")
              container.style.position = "absolute"
              container.style.zIndex = "60"
              document.body.appendChild(container)
              root = createRoot(container)
            }
            const rect = props.clientRect?.()
            if (rect && container) {
              container.style.top = `${rect.bottom + window.scrollY + 6}px`
              container.style.left = `${rect.left + window.scrollX}px`
            }
            root?.render(
              <SlashMenu
                items={currentItems}
                selectedIndex={selectedIndex}
                onSelect={(item) => props.command(item)}
              />,
            )
          }

          function rerender() {
            if (!commandFn) return
            root?.render(
              <SlashMenu
                items={currentItems}
                selectedIndex={selectedIndex}
                onSelect={(item) => commandFn!(item)}
              />,
            )
          }

          return {
            onStart: (props) => {
              selectedIndex = 0
              render(props as RenderProps)
            },
            onUpdate: (props) => {
              render(props as RenderProps)
              selectedIndex = Math.min(
                selectedIndex,
                Math.max(currentItems.length - 1, 0),
              )
              rerender()
            },
            onKeyDown: ({ event }) => {
              if (event.key === "ArrowDown") {
                const len = Math.max(currentItems.length, 1)
                selectedIndex = (selectedIndex + 1) % len
                rerender()
                return true
              }
              if (event.key === "ArrowUp") {
                const len = Math.max(currentItems.length, 1)
                selectedIndex = (selectedIndex - 1 + len) % len
                rerender()
                return true
              }
              if (event.key === "Enter") {
                const item = currentItems[selectedIndex]
                if (item && commandFn) {
                  commandFn(item)
                  return true
                }
              }
              if (event.key === "Escape") {
                unmount()
                return true
              }
              return false
            },
            onExit: () => {
              unmount()
            },
          }
        },
      }),
    ]
  },
})
