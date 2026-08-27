"use client"

import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  Tick02Icon,
  Mortarboard02Icon,
} from "@hugeicons/core-free-icons"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"
import type { TutorPreset } from "@workspace/types"

import { useUpdateNotebookTutorPreset } from "@/lib/hooks/use-workspace"

type TutorToggleProps = {
  notebookId: string
  value: TutorPreset | null
  disabled?: boolean
}

type TutorMeta = {
  id: TutorPreset
  shortLabel: string
  label: string
  tagline: string
}

const TUTORS: TutorMeta[] = [
  {
    id: "default",
    shortLabel: "Default",
    label: "Default tutor",
    tagline: "Clear, direct, balanced answers.",
  },
  {
    id: "eli5",
    shortLabel: "ELI5",
    label: "Feynman / ELI5",
    tagline: "Plain language, friendly analogies.",
  },
  // {
  //   id: "socratic",
  //   shortLabel: "Socratic",
  //   label: "Socratic Tutor",
  //   tagline: "Asks questions, draws the answer out of you.",
  // },
  {
    id: "academic",
    shortLabel: "Academic",
    label: "Academic Scholar",
    tagline: "Rigorous, structured, citation-aware.",
  },
]

const DEFAULT_PRESET: TutorPreset = "default"

export function TutorToggle({
  notebookId,
  value,
  disabled,
}: TutorToggleProps) {
  const mutation = useUpdateNotebookTutorPreset(notebookId)

  const active = (value ?? DEFAULT_PRESET) as TutorPreset
  const activeMeta = TUTORS.find((t) => t.id === active) ?? TUTORS[0]!

  function handleSelect(next: TutorPreset) {
    if (next === active) return
    mutation.mutate(next, {
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to switch tutor",
        )
      },
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            aria-label={`Tutor persona: ${activeMeta.label}`}
            title={`Tutor: ${activeMeta.label}`}
            className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <HugeiconsIcon
              icon={Mortarboard02Icon}
              strokeWidth={2}
              className="size-3.5"
            />
            <span className="min-w-[58px] text-left font-medium">
              {activeMeta.shortLabel}
            </span>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={2}
              className="size-3"
            />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-72 p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Tutor persona
          </DropdownMenuLabel>
          {TUTORS.map((t) => {
            const isActive = t.id === active
            return (
              <DropdownMenuItem
                key={t.id}
                onClick={() => handleSelect(t.id)}
                className="items-start gap-2"
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center",
                    isActive ? "text-foreground" : "text-transparent",
                  )}
                  aria-hidden
                >
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    strokeWidth={2}
                    className="size-3.5"
                  />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {t.label}
                  </span>
                  <span className="text-[11px] leading-snug text-muted-foreground">
                    {t.tagline}
                  </span>
                </span>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
