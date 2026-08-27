"use client"

import { use, useEffect, useMemo, useState } from "react"
import { ReactFlowProvider } from "@xyflow/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Brain01Icon, MagicWand01Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  type LanguageCode,
  normalizeLanguage,
} from "@workspace/types/language"

import { GenerateMindmapDialog } from "@/components/notebook/generate-mindmap-dialog"
import {
  ArtifactLanguageSwitcher,
  pickInitialLanguage,
} from "@/components/notebook/artifact-language-switcher"
import {
  NoSourceTooltip,
  useHasNoSource,
} from "@/components/notebook/generate-button-guard"
import { ManageMindmapsSection } from "@/components/notebook/manage-mindmaps"
import { MindmapCanvas } from "@/components/notebook/mindmap-canvas"
import { useMindmaps } from "@/lib/hooks/use-mindmaps"
import { useTranslateMindmap } from "@/lib/hooks/use-generate"
import { useDefaultLanguage } from "@/lib/hooks/use-me"

const STORAGE_KEY_PREFIX = "arkive:mindmap:lang:"

export default function NotebookMindmapPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const mindmapsQuery = useMindmaps(id)
  const mindmaps = useMemo(() => mindmapsQuery.data ?? [], [mindmapsQuery.data])
  const isLoading = mindmapsQuery.isPending
  const [genOpen, setGenOpen] = useState(false)
  const [view] = useState<"view" | "manage">("view")
  const noSource = useHasNoSource(id)
  const userLanguage = useDefaultLanguage()
  const translate = useTranslateMindmap(id)

  const availableLanguages = useMemo<LanguageCode[]>(() => {
    const seen = new Set<LanguageCode>()
    const out: LanguageCode[] = []
    for (const m of mindmaps) {
      const lc = normalizeLanguage(m.language)
      if (!seen.has(lc)) {
        seen.add(lc)
        out.push(lc)
      }
    }
    return out
  }, [mindmaps])

  const [language, setLanguage] = useState<LanguageCode | null>(null)

  // Once data lands, prefer a previously-chosen language from localStorage,
  // otherwise the user's default, otherwise English, otherwise whatever
  // exists. Same picker the other artifact pages use.
  useEffect(() => {
    if (mindmaps.length === 0) {
      setLanguage(null)
      return
    }
    if (language && availableLanguages.includes(language)) return
    const stored =
      typeof window !== "undefined"
        ? (window.localStorage.getItem(STORAGE_KEY_PREFIX + id) as LanguageCode | null)
        : null
    if (stored && availableLanguages.includes(stored)) {
      setLanguage(stored)
      return
    }
    setLanguage(pickInitialLanguage(availableLanguages, userLanguage))
  }, [mindmaps, availableLanguages, language, id, userLanguage])

  useEffect(() => {
    if (typeof window === "undefined" || !language) return
    window.localStorage.setItem(STORAGE_KEY_PREFIX + id, language)
  }, [id, language])

  const selected = useMemo(() => {
    if (!language) return mindmaps[0] ?? null
    return (
      mindmaps.find((m) => normalizeLanguage(m.language) === language) ?? null
    )
  }, [mindmaps, language])

  async function handleTranslate(target: LanguageCode) {
    try {
      const row = await translate.mutateAsync({ targetLanguage: target })
      setLanguage(normalizeLanguage(row.language))
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to translate mindmap"
      toast.error(msg)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col px-6 py-6">
      {view === "manage" ? (
        <div className="mx-auto w-full max-w-4xl">
          <ManageMindmapsSection
            notebookId={id}
            mindmaps={mindmaps}
            onBack={() => {
              /* manage view disabled while mindmap is single-per-language */
            }}
          />
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Mindmap</h1>
              <p className="text-sm text-muted-foreground">
                Visualise the sources as a tree you can edit.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {mindmaps.length > 0 && language && (
                <ArtifactLanguageSwitcher
                  value={language}
                  available={availableLanguages}
                  onSelect={setLanguage}
                  onTranslate={handleTranslate}
                  pending={translate.isPending}
                />
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1">
            {isLoading ? (
              <MindmapSkeleton />
            ) : selected ? (
              <ReactFlowProvider key={selected.id}>
                <MindmapCanvas mindmap={selected} notebookId={id} />
              </ReactFlowProvider>
            ) : (
              <EmptyState
                notebookId={id}
                noSource={noSource}
                onGenerate={() => setGenOpen(true)}
              />
            )}
          </div>
        </>
      )}

      <GenerateMindmapDialog
        open={genOpen}
        onOpenChange={setGenOpen}
        notebookId={id}
        onGenerated={(m) => setLanguage(normalizeLanguage(m.language))}
      />
    </div>
  )
}

function MindmapSkeleton() {
  return <Skeleton className="h-full min-h-[360px] w-full rounded-2xl" />
}

function EmptyState({
  notebookId,
  noSource,
  onGenerate,
}: {
  notebookId: string
  noSource: boolean
  onGenerate: () => void
}) {
  return (
    <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <HugeiconsIcon icon={Brain01Icon} strokeWidth={2} className="size-6" />
      </span>
      <p className="text-sm text-muted-foreground">
        No mindmaps yet. Generate one from your sources.
      </p>
      <NoSourceTooltip notebookId={notebookId}>
        <Button
          type="button"
          size="sm"
          onClick={onGenerate}
          disabled={noSource}
        >
          <HugeiconsIcon
            icon={MagicWand01Icon}
            strokeWidth={2}
            className="size-4"
          />
          Generate mindmap
        </Button>
      </NoSourceTooltip>
    </div>
  )
}
