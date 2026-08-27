"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import { AiPanel } from "@/components/ai-panel/ai-panel"

function NewChatContent() {
  const search = useSearchParams()
  const [initialMessage, setInitialMessage] = useState<string | null>(null)

  useEffect(() => {
    // Pull the seed message off the URL on first render only - once the
    // session lands a server id we rewrite the URL to /chat/[id] and the
    // seed should not fire again.
    const q = search?.get("q")
    if (q) setInitialMessage(q)
  }, [search])

  return (
    <div className="flex h-screen min-h-0 min-w-0 flex-col overflow-hidden pb-5">
      <AiPanel
        initialUserMessage={initialMessage}
        onSessionCreated={(id) => {
          // IMPORTANT: must NOT use router.replace here - that remounts the
          // page tree and aborts the in-flight stream right after the server
          // sends the X-Session-Id header. Update the URL in place via the
          // History API so the same component keeps consuming the stream.
          if (typeof window !== "undefined") {
            window.history.replaceState({}, "", `/chat/${id}`)
          }
        }}
      />
    </div>
  )
}

export default function NewChatPage() {
  return (
    <Suspense fallback={null}>
      <NewChatContent />
    </Suspense>
  )
}
