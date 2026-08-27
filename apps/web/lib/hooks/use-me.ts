"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { qk } from "@/lib/query-keys"
import { DEFAULT_LANGUAGE, normalizeLanguage, type LanguageCode } from "@workspace/types/language"
import type { Me } from "@workspace/types"

export function useMe() {
  return useQuery({
    queryKey: qk.me(),
    queryFn: () => api.getMe(),
    staleTime: 60_000,
  })
}

/** Resolve the user's preferred content language. Falls back to English while /api/me is loading. */
export function useDefaultLanguage(): LanguageCode {
  const me = useMe()
  return normalizeLanguage(me.data?.language ?? DEFAULT_LANGUAGE)
}

export function useUpdateMe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: { language?: string }) => api.updateMe(patch),
    onSuccess: (me) => {
      qc.setQueryData<Me>(qk.me(), me)
    },
  })
}

export function useUsage() {
  return useQuery({
    queryKey: qk.usage(),
    queryFn: () => api.getUsage(),
    staleTime: 30_000,
  })
}

export function useSubscription() {
  return useQuery({
    queryKey: qk.subscription(),
    queryFn: () => api.getSubscription(),
    staleTime: 30_000,
  })
}
