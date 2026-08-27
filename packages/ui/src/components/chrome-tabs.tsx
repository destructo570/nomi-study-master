"use client"

import { createContext, useContext, useState } from "react"

import { cn } from "@workspace/ui/lib/utils"

type ChromeTabsContextValue = {
  value: string
  setValue: (value: string) => void
}

const ChromeTabsContext = createContext<ChromeTabsContextValue | null>(null)

function useChromeTabs() {
  const ctx = useContext(ChromeTabsContext)
  if (!ctx)
    throw new Error("ChromeTab must be used inside <ChromeTabs>")
  return ctx
}

type ChromeTabsProps = {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}

function ChromeTabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
}: ChromeTabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? "")
  const isControlled = value !== undefined
  const current = isControlled ? value : internal

  const setValue = (next: string) => {
    if (!isControlled) setInternal(next)
    onValueChange?.(next)
  }

  return (
    <ChromeTabsContext.Provider value={{ value: current, setValue }}>
      <div
        data-slot="chrome-tabs"
        className={cn(
          "relative flex items-end gap-1 border-b border-border px-4",
          className,
        )}
      >
        {children}
      </div>
    </ChromeTabsContext.Provider>
  )
}

type ChromeTabProps = {
  value: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}

function ChromeTab({ value, icon, children, className }: ChromeTabProps) {
  const { value: current, setValue } = useChromeTabs()
  const active = current === value

  return (
    <button
      type="button"
      data-slot="chrome-tab"
      data-active={active || undefined}
      onClick={() => setValue(value)}
      className={cn(
        "relative -mb-px inline-flex h-9 items-center gap-2 rounded-t-lg border border-b-0 border-transparent px-4 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        active
          ? "z-10 border-border bg-background text-foreground"
          : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
    </button>
  )
}

export { ChromeTabs, ChromeTab }
