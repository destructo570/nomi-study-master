import { PostHog } from "posthog-node"

let client: PostHog | null = null
let warned = false

function getClient(): PostHog | null {
  const token = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!token) {
    if (!warned) {
      console.warn("[posthog] NEXT_PUBLIC_POSTHOG_KEY missing — server events skipped")
      warned = true
    }
    return null
  }
  if (!client) {
    client = new PostHog(token, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return client
}

export function capture(args: {
  distinctId: string
  event: string
  properties?: Record<string, unknown>
}) {
  const ph = getClient()
  if (!ph) return
  ph.capture({
    distinctId: args.distinctId,
    event: args.event,
    properties: args.properties,
  })
}

export function captureException(error: unknown, distinctId?: string) {
  const ph = getClient()
  if (!ph) return
  ph.captureException(
    error instanceof Error ? error : new Error(String(error)),
    distinctId,
  )
}

export async function shutdown() {
  if (client) await client.shutdown()
}
