"use client"

type YoutubeEmbedProps = {
  videoId: string
  title?: string | null
  className?: string
}

export function YoutubeEmbed({ videoId, title, className }: YoutubeEmbedProps) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border bg-muted ${className ?? ""}`}
      style={{ aspectRatio: "16 / 9" }}
    >
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title={title ?? "YouTube video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 h-full w-full"
      />
    </div>
  )
}

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/

// Mirrors the backend parser in apps/backend/src/lib/extract/youtube.ts so
// the editor can render the embed without an extra round-trip.
export function videoIdFromUrl(input: string | null | undefined): string | null {
  if (!input) return null
  const trimmed = input.trim()
  if (VIDEO_ID_RE.test(trimmed)) return trimmed
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }
  const host = url.hostname.replace(/^www\./, "")
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0] ?? ""
    return VIDEO_ID_RE.test(id) ? id : null
  }
  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtube-nocookie.com"
  ) {
    if (url.pathname === "/watch") {
      const v = url.searchParams.get("v") ?? ""
      return VIDEO_ID_RE.test(v) ? v : null
    }
    const m = url.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/)
    if (m && VIDEO_ID_RE.test(m[1]!)) return m[1]!
  }
  return null
}
