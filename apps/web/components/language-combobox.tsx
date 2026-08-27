"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  Search01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  getLanguage,
  type Language,
  type LanguageCode,
} from "@workspace/types/language"

type Size = "sm" | "default"

type Props = {
  value: LanguageCode | null | undefined
  onChange: (code: LanguageCode) => void
  disabled?: boolean
  size?: Size
  align?: "start" | "center" | "end"
  className?: string
  /** When true, render just the flag + chevron (no text). Used in compact rows. */
  iconOnly?: boolean
}

export function LanguageCombobox({
  value,
  onChange,
  disabled,
  size = "default",
  align = "start",
  className,
  iconOnly,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const current = getLanguage(value ?? DEFAULT_LANGUAGE)

  useEffect(() => {
    if (open) {
      setQuery("")
      // Focus search input after popover paints
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const filtered = useMemo(() => filterLanguages(query), [query])

  function pick(code: LanguageCode) {
    onChange(code)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-2 rounded-md border border-border bg-card text-sm transition-colors outline-none hover:border-foreground/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60",
          size === "sm" ? "h-8 px-2.5" : "h-9 px-3",
          iconOnly && "px-2",
          className,
        )}
      >
        <span aria-hidden="true" className="text-[15px] leading-none">
          {current.flag}
        </span>
        {!iconOnly && (
          <span className="min-w-0 flex-1 truncate text-left text-foreground">
            {current.name}
          </span>
        )}
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          className="size-3.5 shrink-0 text-muted-foreground"
        />
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={6}
        className="w-[280px] gap-0 p-0"
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="size-4 shrink-0 text-muted-foreground"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search language…"
            className="h-7 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Search language"
          />
        </div>
        <ul
          role="listbox"
          aria-label="Languages"
          className="max-h-72 overflow-y-auto py-1"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-xs text-muted-foreground">
              No languages match “{query}”
            </li>
          ) : (
            filtered.map((lang) => {
              const selected = lang.code === current.code
              return (
                <li key={lang.code} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => pick(lang.code)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                      selected && "bg-muted/60",
                    )}
                  >
                    <span className="text-[16px] leading-none" aria-hidden="true">
                      {lang.flag}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-foreground">
                      {lang.name}
                    </span>
                    <span className="shrink-0 truncate text-xs text-muted-foreground">
                      {lang.nativeName}
                    </span>
                    {selected && (
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        strokeWidth={2}
                        className="ml-1 size-3.5 shrink-0 text-foreground"
                      />
                    )}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

function filterLanguages(query: string): Language[] {
  const q = query.trim().toLowerCase()
  if (!q) return SUPPORTED_LANGUAGES
  return SUPPORTED_LANGUAGES.filter((l) => {
    return (
      l.code.toLowerCase().includes(q) ||
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q)
    )
  })
}
