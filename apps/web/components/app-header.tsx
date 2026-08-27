"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { PanelLeftIcon } from "@hugeicons/core-free-icons"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { useSidebar } from "@workspace/ui/components/sidebar"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

import { ArkiveLogo } from "@/components/app-sidebar"
import { useNotebook, useShelf } from "@/lib/hooks/use-workspace"

type Crumb = { label: string; href?: string }

const CRUMB_MAX_CHARS_DESKTOP = 80
const CRUMB_MAX_CHARS_MOBILE = 16

function clampLabel(label: string, max: number): string {
  if (label.length <= max) return label
  return label.slice(0, max).trimEnd() + "…"
}

function useCrumbs(): Crumb[] {
  const pathname = usePathname() ?? "/"
  const parts = pathname.split("/").filter(Boolean)
  const section = parts[0]
  const id = parts[1]

  const notebookQuery = useNotebook(section === "notebook" && id ? id : "")
  const shelfIdForCrumb =
    section === "shelf"
      ? id
      : section === "notebook"
        ? notebookQuery.data?.shelfId
        : undefined
  const shelfQuery = useShelf(shelfIdForCrumb ?? "")

  const crumbs: Crumb[] = []

  // Chat pages own the entire main column - no breadcrumb noise on top.
  if (section === "chat" || section === "chats") return crumbs

  if (section === "notebook") {
    if (shelfQuery.data) {
      crumbs.push({ label: shelfQuery.data.name, href: `/shelf/${shelfQuery.data.id}` })
    }
    if (notebookQuery.data) {
      crumbs.push({ label: notebookQuery.data.title })
    }
    return crumbs
  }

  crumbs.push({ label: "Home", href: "/home" })

  if (section === "shelf" && shelfQuery.data) {
    crumbs.push({ label: shelfQuery.data.name })
  }

  return crumbs
}

export function AppHeader() {
  const pathname = usePathname() ?? "/"
  const crumbs = useCrumbs()
  const { state, openMobile, toggleSidebar } = useSidebar()
  const isMobile = useIsMobile()
  const collapsed = isMobile ? !openMobile : state === "collapsed"
  const maxChars = isMobile ? CRUMB_MAX_CHARS_MOBILE : CRUMB_MAX_CHARS_DESKTOP

  // Chat routes own the entire main column; render nothing so the panel
  // can fill the viewport without an empty header strip on top.
  const section = pathname.split("/").filter(Boolean)[0]
  if (section === "chat" || section === "chats") return null

  return (
    <header className="flex h-10 items-center gap-3 px-5">
      {collapsed && (
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Open sidebar"
          className="group relative flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ArkiveLogo className="size-7 text-foreground transition-opacity duration-150 group-hover:opacity-0" />
          <HugeiconsIcon
            icon={PanelLeftIcon}
            strokeWidth={2}
            className="absolute size-4 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          />
        </button>
      )}
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap text-[13px]">
          {crumbs.map((c, i) => {
            const isLast = i === crumbs.length - 1
            return (
              <span key={`${c.label}-${i}`} className="contents">
                {i > 0 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
                <BreadcrumbItem className={cn(isLast && "min-w-0")}>
                  {isLast || !c.href ? (
                    <BreadcrumbPage
                      title={c.label}
                      className={cn(isLast && "block truncate")}
                    >
                      {clampLabel(c.label, maxChars)}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      render={
                        <Link href={c.href} title={c.label}>
                          {clampLabel(c.label, maxChars)}
                        </Link>
                      }
                    />
                  )}
                </BreadcrumbItem>
              </span>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}
