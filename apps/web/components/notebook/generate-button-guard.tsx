"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import { useSources } from "@/lib/hooks/use-sources"

export function NoSourceTooltip({
  notebookId,
  children,
}: {
  notebookId: string
  children: React.ReactNode
}) {
  const sourcesQuery = useSources(notebookId)
  const hasNoSource = (sourcesQuery.data?.length ?? 0) === 0

  if (!hasNoSource) return <>{children}</>

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          {children}
        </TooltipTrigger>
        <TooltipContent>No source found</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function useHasNoSource(notebookId: string): boolean {
  const sourcesQuery = useSources(notebookId)
  return (sourcesQuery.data?.length ?? 0) === 0
}
