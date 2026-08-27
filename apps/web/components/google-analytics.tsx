"use client"

import { useEffect, useRef } from "react"
import Script from "next/script"
import { usePathname, useSearchParams } from "next/navigation"

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

type GoogleAnalyticsProps = {
  measurementId: string
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const trackedInitialPageView = useRef(false)

  useEffect(() => {
    if (!trackedInitialPageView.current) {
      trackedInitialPageView.current = true
      return
    }

    if (!measurementId || typeof window.gtag !== "function") {
      return
    }

    const search = searchParams.toString()
    const pagePath = search ? `${pathname}?${search}` : pathname

    window.gtag("config", measurementId, {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    })
  }, [measurementId, pathname, searchParams])

  if (!measurementId) {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  )
}
