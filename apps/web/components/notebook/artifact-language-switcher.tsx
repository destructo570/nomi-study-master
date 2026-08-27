"use client"

import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  Loading03Icon,
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
  type LanguageCode,
} from "@workspace/types/language"

type Props = {
  /** Currently viewed language. */
  value: LanguageCode
  /** Languages this artifact already has on disk. */
  available: LanguageCode[]
  /** User picked a language that already exists locally - just switch view. */
  onSelect: (code: LanguageCode) => void
  /** User picked a language that doesn't exist yet - call the API. */
  onTranslate: (code: LanguageCode) => void
  pending?: boolean
  disabled?: boolean
  className?: string
}

export function ArtifactLanguageSwitcher({
  value,
  available,
  onSelect,
  onTranslate,
  pending,
  disabled,
  className,
}: Props) {
  const [open, setOpen] = useState(false)
  const current = getLanguage(value)
  const availableSet = useMemo(() => new Set(available), [available])

  const availableLangs = useMemo(
    () => SUPPORTED_LANGUAGES.filter((l) => availableSet.has(l.code)),
    [availableSet],
  )
  const translateLangs = useMemo(
    () => SUPPORTED_LANGUAGES.filter((l) => !availableSet.has(l.code)),
    [availableSet],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "inline-flex h-8 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-sm transition-colors outline-none hover:border-foreground/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      >
        <span aria-hidden="true" className="text-[15px] leading-none">
          {current.flag}
        </span>
        <span className="min-w-0 flex-1 truncate text-left text-foreground">
          {current.name}
        </span>
        {pending ? (
          <HugeiconsIcon
            icon={Loading03Icon}
            strokeWidth={2}
            className="size-3.5 shrink-0 animate-spin text-muted-foreground"
          />
        ) : (
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            strokeWidth={2}
            className="size-3.5 shrink-0 text-muted-foreground"
          />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="w-[280px] gap-0 p-0">
        <Section label="Available">
          {availableLangs.length === 0 ? (
            <Empty>No languages yet</Empty>
          ) : (
            availableLangs.map((lang) => {
              const selected = lang.code === current.code
              return (
                <Row
                  key={lang.code}
                  selected={selected}
                  onClick={() => {
                    onSelect(lang.code)
                    setOpen(false)
                  }}
                >
                  <span className="text-[16px] leading-none" aria-hidden="true">
                    {lang.flag}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{lang.name}</span>
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
                </Row>
              )
            })
          )}
        </Section>

        <div className="border-t border-border" />

        <Section label="Translate to…">
          {translateLangs.length === 0 ? (
            <Empty>Every supported language is available</Empty>
          ) : (
            translateLangs.map((lang) => (
              <Row
                key={lang.code}
                onClick={() => {
                  onTranslate(lang.code)
                  setOpen(false)
                }}
              >
                <span className="text-[16px] leading-none" aria-hidden="true">
                  {lang.flag}
                </span>
                <span className="min-w-0 flex-1 truncate">{lang.name}</span>
                <span className="shrink-0 truncate text-xs text-muted-foreground">
                  {lang.nativeName}
                </span>
              </Row>
            ))
          )}
        </Section>
      </PopoverContent>
    </Popover>
  )
}

function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="py-1">
      <div className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <ul role="listbox" aria-label={label} className="max-h-56 overflow-y-auto">
        {children}
      </ul>
    </div>
  )
}

function Row({
  children,
  onClick,
  selected,
}: {
  children: React.ReactNode
  onClick: () => void
  selected?: boolean
}) {
  return (
    <li role="option" aria-selected={selected}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted",
          selected && "bg-muted/60",
        )}
      >
        {children}
      </button>
    </li>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <li className="px-3 py-3 text-center text-xs text-muted-foreground">
      {children}
    </li>
  )
}

/** Pick the language to display first when a page mounts. Prefers the
 *  notebook/user's preferred language if it exists, then falls back to
 *  English, then to whatever the artifact has. */
export function pickInitialLanguage(
  available: LanguageCode[],
  preferred: LanguageCode | null | undefined,
): LanguageCode | null {
  if (available.length === 0) return null
  if (preferred && available.includes(preferred)) return preferred
  if (available.includes(DEFAULT_LANGUAGE)) return DEFAULT_LANGUAGE
  return available[0] ?? null
}
