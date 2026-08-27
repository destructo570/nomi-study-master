type Channel = "transcription" | "openai" | "general"

type Field = { name: string; value: string; inline?: boolean }

type EmbedInput = {
  title: string
  description?: string
  color?: number
  fields?: Field[]
  footer?: string
}

const COLORS = {
  blue: 0x3b82f6,
  green: 0x22c55e,
  red: 0xef4444,
  yellow: 0xeab308,
  gray: 0x6b7280,
} as const

function truncate(value: string, max: number): string {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1)}…`
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  const rs = Math.round(s - m * 60)
  return `${m}m ${rs}s`
}

export class DiscordLogger {
  private readonly webhooks: Record<Channel, string | undefined>
  private readonly enabled: boolean

  constructor() {
    this.webhooks = {
      transcription: process.env.DISCORD_TRANSCRIPTION_WEBHOOK,
      openai: process.env.DISCORD_OPENAI_WEBHOOK,
      general: process.env.DISCORD_GENERAL_WEBHOOK,
    }
    this.enabled = Boolean(
      this.webhooks.transcription ||
        this.webhooks.openai ||
        this.webhooks.general,
    )
  }

  private async send(channel: Channel, embed: EmbedInput): Promise<void> {
    const url = this.webhooks[channel] ?? this.webhooks.general
    if (!url) return
    const payload = {
      embeds: [
        {
          title: truncate(embed.title, 256),
          description: embed.description
            ? truncate(embed.description, 4000)
            : undefined,
          color: embed.color ?? COLORS.gray,
          fields: embed.fields?.map((f) => ({
            name: truncate(f.name, 256),
            value: truncate(f.value, 1024),
            inline: f.inline ?? true,
          })),
          footer: embed.footer ? { text: truncate(embed.footer, 2048) } : undefined,
          timestamp: new Date().toISOString(),
        },
      ],
    }
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.text().catch(() => "")
        console.error(
          `[discord-logger] webhook ${channel} returned ${res.status}: ${body.slice(0, 200)}`,
        )
      }
    } catch (err) {
      console.error("[discord-logger] webhook post failed:", err)
    }
  }

  transcriptionStart(args: {
    sourceId: string
    fileName?: string | null
    mimeType?: string | null
    sizeBytes?: number
  }): void {
    void this.send("transcription", {
      title: "🎬 Transcription started",
      color: COLORS.blue,
      fields: [
        { name: "Source", value: `\`${args.sourceId}\`` },
        { name: "File", value: args.fileName ?? "—" },
        { name: "Type", value: args.mimeType ?? "—" },
        ...(args.sizeBytes != null
          ? [
              {
                name: "Size",
                value: `${(args.sizeBytes / (1024 * 1024)).toFixed(2)} MB`,
              },
            ]
          : []),
      ],
    })
  }

  transcriptionChunkPlan(args: {
    sourceId: string
    chunkCount: number
    chunkDurationSec: number
    concurrency: number
  }): void {
    void this.send("transcription", {
      title: "🧩 Chunking plan",
      color: COLORS.gray,
      fields: [
        { name: "Source", value: `\`${args.sourceId}\`` },
        { name: "Chunks", value: String(args.chunkCount) },
        { name: "Chunk duration", value: `${args.chunkDurationSec}s` },
        { name: "Concurrency", value: String(args.concurrency) },
      ],
    })
  }

  transcriptionCompleted(args: {
    sourceId: string
    durationMs: number
    chunkCount: number
    textLength: number
  }): void {
    void this.send("transcription", {
      title: "✅ Transcription completed",
      color: COLORS.green,
      fields: [
        { name: "Source", value: `\`${args.sourceId}\`` },
        { name: "Chunks", value: String(args.chunkCount) },
        { name: "Elapsed", value: formatDuration(args.durationMs) },
        { name: "Chars", value: String(args.textLength) },
      ],
    })
  }

  transcriptionError(args: {
    sourceId: string
    durationMs: number
    error: unknown
  }): void {
    const message =
      args.error instanceof Error ? args.error.message : String(args.error)
    void this.send("transcription", {
      title: "❌ Transcription failed",
      color: COLORS.red,
      fields: [
        { name: "Source", value: `\`${args.sourceId}\`` },
        { name: "Elapsed", value: formatDuration(args.durationMs) },
      ],
      description: `\`\`\`\n${truncate(message, 1500)}\n\`\`\``,
    })
  }

  embedStart(args: {
    sourceId: string
    chunkCount: number
    cachedCount?: number
  }): void {
    const fields = [
      { name: "Source", value: `\`${args.sourceId}\`` },
      { name: "Chunks", value: String(args.chunkCount) },
    ]
    if (typeof args.cachedCount === "number") {
      fields.push({
        name: "Cached",
        value: `${args.cachedCount}/${args.chunkCount}`,
      })
    }
    void this.send("openai", {
      title: "🧠 Embedding started",
      color: COLORS.blue,
      fields,
    })
  }

  embedCompleted(args: {
    sourceId: string
    durationMs: number
    chunkCount: number
    vectorCount: number
  }): void {
    void this.send("openai", {
      title: "✅ Embedding completed",
      color: COLORS.green,
      fields: [
        { name: "Source", value: `\`${args.sourceId}\`` },
        { name: "Chunks", value: String(args.chunkCount) },
        { name: "Vectors", value: String(args.vectorCount) },
        { name: "Elapsed", value: formatDuration(args.durationMs) },
      ],
    })
  }

  embedError(args: { sourceId: string; error: unknown }): void {
    const message =
      args.error instanceof Error ? args.error.message : String(args.error)
    void this.send("openai", {
      title: "❌ Embedding failed",
      color: COLORS.red,
      fields: [{ name: "Source", value: `\`${args.sourceId}\`` }],
      description: `\`\`\`\n${truncate(message, 1500)}\n\`\`\``,
    })
  }

  openaiError(args: {
    operation: string
    error: unknown
    context?: Record<string, string | number | undefined>
  }): void {
    const message =
      args.error instanceof Error ? args.error.message : String(args.error)
    const fields: Field[] = [{ name: "Operation", value: args.operation }]
    if (args.context) {
      for (const [k, v] of Object.entries(args.context)) {
        if (v != null) fields.push({ name: k, value: String(v) })
      }
    }
    void this.send("openai", {
      title: "⚠️ OpenAI error",
      color: COLORS.red,
      fields,
      description: `\`\`\`\n${truncate(message, 1500)}\n\`\`\``,
    })
  }

  info(title: string, description?: string): void {
    void this.send("general", {
      title: `ℹ️ ${title}`,
      color: COLORS.blue,
      description,
    })
  }

  warn(title: string, description?: string): void {
    void this.send("general", {
      title: `⚠️ ${title}`,
      color: COLORS.yellow,
      description,
    })
  }

  error(title: string, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error)
    void this.send("general", {
      title: `🚨 ${title}`,
      color: COLORS.red,
      description: `\`\`\`\n${truncate(message, 1500)}\n\`\`\``,
    })
  }

  get isEnabled(): boolean {
    return this.enabled
  }
}

let instance: DiscordLogger | null = null

export function discordLogger(): DiscordLogger {
  if (!instance) instance = new DiscordLogger()
  return instance
}
