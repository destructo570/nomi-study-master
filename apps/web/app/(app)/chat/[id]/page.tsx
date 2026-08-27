"use client"

import { use } from "react"

import { AiPanel } from "@/components/ai-panel/ai-panel"
import { DocumentTitle } from "@/components/seo/document-title"
import { useChatSessionDetail } from "@/lib/hooks/use-chats"

export default function ChatSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const session = useChatSessionDetail(id)
  return (
    <div className="flex h-screen min-h-0 min-w-0 flex-col overflow-hidden pb-5">
      <DocumentTitle title={session.data?.title ?? "Chat"} />
      <AiPanel initialSessionId={id} />
    </div>
  )
}
