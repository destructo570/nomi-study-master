"use client"

import { useEffect } from "react"

const SUFFIX = " · nomi"

export function DocumentTitle({ title }: { title?: string | null }) {
  useEffect(() => {
    if (!title) return
    const previous = document.title
    document.title = `${title}${SUFFIX}`
    return () => {
      document.title = previous
    }
  }, [title])

  return null
}
