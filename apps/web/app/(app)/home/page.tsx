"use client"

import { HomeChats } from "@/components/home/home-chats"
import { HomeHero } from "@/components/home/home-hero"
import { HomeLibrary } from "@/components/home/home-library"
import { HomeRecents } from "@/components/home/home-recents"

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 px-6 py-10 sm:px-8">
      <HomeHero />
      <HomeLibrary />
      <HomeRecents />
      <HomeChats />
    </div>
  )
}
