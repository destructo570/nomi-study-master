import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const BUCKET = process.env.R2_BUCKET
const PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL ?? null
const KEY_PREFIX = (process.env.R2_KEY_PREFIX ?? "").replace(/^\/+|\/+$/g, "")

export function buildStorageKey(...parts: string[]): string {
  const cleaned = parts
    .flatMap((p) => p.split("/"))
    .map((p) => p.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
  return [KEY_PREFIX, ...cleaned].filter(Boolean).join("/")
}

let client: S3Client | null = null

function getClient(): S3Client {
  if (client) return client
  if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET) {
    throw new Error(
      "R2 is not configured. Set R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.",
    )
  }
  client = new S3Client({
    region: "auto",
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  })
  return client
}

export function getBucket(): string {
  if (!BUCKET) throw new Error("R2_BUCKET not set")
  return BUCKET
}

export async function createPresignedUploadUrl(args: {
  key: string
  contentType: string
  contentLength: number
  expiresInSeconds?: number
}): Promise<{ url: string }> {
  const cmd = new PutObjectCommand({
    Bucket: getBucket(),
    Key: args.key,
    ContentType: args.contentType,
    ContentLength: args.contentLength,
  })
  const url = await getSignedUrl(getClient(), cmd, {
    expiresIn: args.expiresInSeconds ?? 300,
    unhoistableHeaders: new Set(["content-length"]),
  })
  return { url }
}

export async function createPresignedDownloadUrl(args: {
  key: string
  expiresInSeconds?: number
}): Promise<{ url: string }> {
  const cmd = new GetObjectCommand({
    Bucket: getBucket(),
    Key: args.key,
  })
  const url = await getSignedUrl(getClient(), cmd, {
    expiresIn: args.expiresInSeconds ?? 6 * 60 * 60,
  })
  return { url }
}

export async function headObject(key: string): Promise<{ contentLength: number | null } | null> {
  try {
    const res = await getClient().send(
      new HeadObjectCommand({ Bucket: getBucket(), Key: key }),
    )
    return { contentLength: typeof res.ContentLength === "number" ? res.ContentLength : null }
  } catch (err) {
    const name = (err as { name?: string; $metadata?: { httpStatusCode?: number } }).name
    const code = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
    if (name === "NotFound" || code === 404) return null
    throw err
  }
}

export async function downloadObjectToBuffer(key: string): Promise<Buffer> {
  const res = await getClient().send(
    new GetObjectCommand({ Bucket: getBucket(), Key: key }),
  )
  const body = res.Body as unknown as {
    transformToByteArray?: () => Promise<Uint8Array>
  }
  if (!body?.transformToByteArray) {
    throw new Error("R2 response body has no transformToByteArray")
  }
  const bytes = await body.transformToByteArray()
  return Buffer.from(bytes)
}

export async function deleteObject(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }))
}

export async function uploadObject(args: {
  key: string
  body: Buffer
  contentType: string
}): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: args.key,
      Body: args.body,
      ContentType: args.contentType,
      ContentLength: args.body.byteLength,
    }),
  )
}

export function publicUrlFor(key: string): string | null {
  if (!PUBLIC_BASE_URL) return null
  return `${PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`
}
