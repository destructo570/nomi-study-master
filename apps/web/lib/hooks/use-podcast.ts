"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { api } from "@/lib/api"
import { qk } from "@/lib/query-keys"
import type { KokoroVoiceId, Podcast } from "@workspace/types"

export function usePodcast(notebookId: string) {
  return useQuery({
    queryKey: qk.podcast(notebookId),
    queryFn: () => api.getPodcast(notebookId),
    enabled: !!notebookId,
    staleTime: Infinity,
    // Poll while a generation is in flight. TanStack passes the Query
    // instance so we can branch on the latest server state without keeping
    // a parallel timer.
    refetchInterval: (q) => {
      const data = q.state.data
      return data && (data.status === "pending" || data.status === "generating")
        ? 3000
        : false
    },
  })
}

export function useGeneratePodcast(notebookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      voicePrimary: KokoroVoiceId
      voiceSecondary: KokoroVoiceId
    }) => api.generatePodcast({ notebookId, ...input }),
    onSuccess: (row) => {
      qc.setQueryData<Podcast | null>(qk.podcast(notebookId), row)
    },
  })
}

export function usePodcastAudioUrl(podcastId: string | null) {
  return useQuery({
    queryKey: qk.podcastAudio(podcastId ?? ""),
    queryFn: () => {
      if (!podcastId) throw new Error("podcastId required")
      return api.getPodcastAudioUrl(podcastId)
    },
    enabled: !!podcastId,
    // R2 presigned URLs we mint expire in 6 hours; refresh well before that
    // so a long listening session doesn't 403 mid-playback.
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
