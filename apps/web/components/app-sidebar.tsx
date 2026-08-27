"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Archive02Icon,
  ArrowRight01Icon,
  BubbleChatIcon,
  DiscordIcon,
  Home04Icon,
  PanelRightIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"

import { UserAvatar } from "@/components/user-avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@workspace/ui/components/sidebar"

import {
  useCreateShelf,
  useRecentNotebooks,
  useShelves,
} from "@/lib/hooks/use-workspace"
import { useStandaloneChatSessions } from "@/lib/hooks/use-chats"
import { useMe } from "@/lib/hooks/use-me"
import { PromptDialog } from "@/components/prompt-dialog"
import { SettingsModal } from "@/components/settings/settings-modal"
import { FeedbackDialog } from "@/components/feedback-dialog"

const DISCORD_INVITE_URL =
  process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ?? "https://discord.gg/3ShYE6v2md"
import { SidebarChatItem } from "@/components/sidebar/sidebar-chat-item"
import { SidebarShelfItem } from "@/components/sidebar/sidebar-shelf-item"

export function ArkiveLogo({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <img
      src="/icons/nomi-logo.svg"
      alt="nomi"
      className={className}
      style={style}
    />
  )
}

function SidebarHeaderLogo() {
  const { toggleSidebar } = useSidebar()
  return (
    <div className="flex items-center justify-between gap-2 px-1 pt-2">
      <Link href="/home" className="flex items-center gap-2">
        <ArkiveLogo className="size-[22px] text-foreground" />
        <span className="font-brand text-[20px] font-bold leading-none tracking-tight">
          nomi
        </span>
      </Link>
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="Collapse sidebar"
        className="flex size-7 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        <HugeiconsIcon icon={PanelRightIcon} strokeWidth={2} className="size-4" />
      </button>
    </div>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const shelvesQuery = useShelves()
  const recentsQuery = useRecentNotebooks()
  const chatsQuery = useStandaloneChatSessions()
  const createShelf = useCreateShelf()
  const me = useMe()
  const { isMobile, setOpenMobile } = useSidebar()
  const [createOpen, setCreateOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [chatsOpen, setChatsOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const handleNavClick = (e: React.MouseEvent) => {
    if (!isMobile) return
    const target = e.target as Element | null
    if (target?.closest("a")) setOpenMobile(false)
  }

  const displayName = me.data?.name ?? me.data?.email?.split("@")[0] ?? ""
  const email = me.data?.email ?? ""
  const initial = (displayName || email || "?").trim().charAt(0).toUpperCase()

  return (
    <>
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="px-2 pb-2 pt-1" onClick={handleNavClick}>
        <SidebarHeaderLogo />
      </SidebarHeader>

      <SidebarContent onClick={handleNavClick}>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/home"}
                  tooltip="Home"
                  render={
                    <Link href="/home">
                      <HugeiconsIcon icon={Home04Icon} strokeWidth={2} className="size-4" />
                      <span>Home</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/archive"}
                  tooltip="Archive"
                  render={
                    <Link href="/archive">
                      <HugeiconsIcon icon={Archive02Icon} strokeWidth={2} className="size-4" />
                      <span>Archive</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Recent notebooks</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {recentsQuery.data?.slice(0, 3).map((nb) => (
                <SidebarMenuItem key={nb.id}>
                  <SidebarMenuButton
                    isActive={
                      pathname === `/notebook/${nb.id}` ||
                      pathname.startsWith(`/notebook/${nb.id}/`)
                    }
                    tooltip={nb.title}
                    render={
                      <Link href={`/notebook/${nb.id}`}>
                        <span className="truncate">{nb.title}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
              {recentsQuery.data?.length === 0 && (
                <SidebarMenuItem>
                  <span className="px-2 py-1 text-xs text-sidebar-foreground/60">
                    No recent notebooks
                  </span>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>My Library</SidebarGroupLabel>
          <SidebarGroupAction
            title="New library"
            onClick={() => setCreateOpen(true)}
          >
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4" />
            <span className="sr-only">New library</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {shelvesQuery.data?.map((shelf) => (
                <SidebarShelfItem key={shelf.id} shelf={shelf} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel
            render={
              <button
                type="button"
                onClick={() => setChatsOpen((v) => !v)}
                aria-expanded={chatsOpen}
                aria-controls="sidebar-chats-content"
                className="flex w-full cursor-pointer items-center gap-1 hover:text-sidebar-foreground/70"
              >
                <span>My Chats</span>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  className={`size-3 transition-transform duration-100 ease-out ${
                    chatsOpen ? "rotate-90" : ""
                  }`}
                />
              </button>
            }
          />
          <SidebarGroupAction
            title="New chat"
            render={
              <Link href="/chat" aria-label="New chat">
                <HugeiconsIcon
                  icon={PlusSignIcon}
                  strokeWidth={2}
                  className="size-4"
                />
                <span className="sr-only">New chat</span>
              </Link>
            }
          />
          <div
            id="sidebar-chats-content"
            className={`grid transition-[grid-template-rows] duration-100 ease-out ${
              chatsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <SidebarGroupContent>
                <SidebarMenu>
                  {chatsQuery.data?.slice(0, 3).map((chat) => (
                    <SidebarChatItem key={chat.id} chat={chat} />
                  ))}
                  {(chatsQuery.data?.length ?? 0) > 0 && (
                    <SidebarMenuItem>
                      <Link
                        href="/chats"
                        className="block px-2 py-1 text-right text-[11px] text-sidebar-foreground/70 underline-offset-4 hover:text-sidebar-foreground hover:underline"
                      >
                        View all chats
                      </Link>
                    </SidebarMenuItem>
                  )}
                  {chatsQuery.data?.length === 0 && (
                    <SidebarMenuItem>
                      <span className="px-2 py-1 text-xs text-sidebar-foreground/60">
                        No chats yet
                      </span>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </div>
          </div>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Other</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Discord Community"
                  render={
                    <a
                      href={DISCORD_INVITE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <HugeiconsIcon
                        icon={DiscordIcon}
                        strokeWidth={2}
                        className="size-4"
                      />
                      <span>Discord Community</span>
                    </a>
                  }
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Feedback"
                  onClick={() => {
                    if (isMobile) setOpenMobile(false)
                    setFeedbackOpen(true)
                  }}
                >
                  <HugeiconsIcon
                    icon={BubbleChatIcon}
                    strokeWidth={2}
                    className="size-4"
                  />
                  <span>Feedback</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2 p-3">
        <button
          type="button"
          onClick={() => {
            if (isMobile) setOpenMobile(false)
            setSettingsOpen(true)
          }}
          className="flex items-center gap-2 rounded-md px-1.5 py-1.5 text-left hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <UserAvatar
            name={displayName || email || initial}
            size={32}
          />
          <div className="min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium">{displayName || "-"}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{email || "-"}</p>
          </div>
        </button>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>

    <PromptDialog
      open={createOpen}
      onOpenChange={setCreateOpen}
      title="New library"
      label="Library name"
      placeholder="e.g. Research"
      confirmLabel="Create"
      onSubmit={(name) => createShelf.mutateAsync(name)}
    />

    <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

    <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  )
}
