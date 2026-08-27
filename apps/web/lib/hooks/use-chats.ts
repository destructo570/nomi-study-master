"use client"

import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { qk } from "@/lib/query-keys"

export function useStandaloneChatSessions() {
  return useQuery({
    queryKey: qk.standaloneChatSessions(),
    queryFn: () => api.listStandaloneChatSessions(),
  })
}

export function useChatSessionDetail(sessionId: string | null | undefined) {
  return useQuery({
    queryKey: qk.chatSession(sessionId ?? ""),
    queryFn: () => api.getChatSession(sessionId as string),
    enabled: !!sessionId,
  })
}
