"use client"

import { useEffect, useState } from "react"

type NotebookTitleProps = {
  title: string
  onCommit: (title: string) => void
  readOnly?: boolean
}

export function NotebookTitle({ title, onCommit, readOnly }: NotebookTitleProps) {
  const [value, setValue] = useState(title)

  useEffect(() => {
    setValue(title)
  }, [title])

  function commit() {
    const trimmed = value.trim()
    if (!trimmed || trimmed === title) {
      setValue(title)
      return
    }
    onCommit(trimmed)
  }

  if (readOnly) {
    return (
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
    )
  }

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          ;(e.currentTarget as HTMLInputElement).blur()
        }
        if (e.key === "Escape") {
          setValue(title)
          ;(e.currentTarget as HTMLInputElement).blur()
        }
      }}
      placeholder="Untitled"
      aria-label="Notebook title"
      className="w-full bg-transparent text-3xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/40"
    />
  )
}
