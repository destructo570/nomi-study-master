"use client"

import { useEffect, useState } from "react"

const LG_QUERY = "(min-width: 1024px)"

export function useIsLg(): boolean {
  const [isLg, setIsLg] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const mql = window.matchMedia(LG_QUERY)
    const update = () => setIsLg(mql.matches)
    update()
    mql.addEventListener("change", update)
    return () => mql.removeEventListener("change", update)
  }, [])

  return isLg
}
