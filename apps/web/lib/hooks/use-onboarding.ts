"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { qk } from "@/lib/query-keys"
import type { OnboardingAnswers, OnboardingResponse } from "@workspace/types"

export function useOnboarding() {
  return useQuery({
    queryKey: qk.onboarding(),
    queryFn: () => api.getOnboarding(),
    staleTime: 60_000,
  })
}

export function useSaveOnboarding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (answers: OnboardingAnswers) => api.saveOnboarding(answers),
    onSuccess: (data) => {
      qc.setQueryData<OnboardingResponse>(qk.onboarding(), data)
    },
  })
}
