import { Queue, Worker, type Processor } from "bullmq"
import IORedis, { type Redis } from "ioredis"

const REDIS_URL = process.env.REDIS_URL

let connection: Redis | null = null

export function getConnection(): Redis {
  if (connection) return connection
  if (!REDIS_URL) {
    throw new Error("REDIS_URL is not set. Configure Redis to enable background file processing.")
  }
  if (!/^rediss?:\/\//.test(REDIS_URL)) {
    throw new Error(
      `REDIS_URL must start with redis:// or rediss:// (got "${REDIS_URL}"). Example: redis://localhost:6379`,
    )
  }
  connection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
  })
  connection.on("error", (err) => {
    console.error("[redis]", err.message)
  })
  return connection
}

export const FILE_PROCESS_QUEUE = "file-process"

export type FileProcessJobData = {
  sourceId: string
}

let queue: Queue<FileProcessJobData> | null = null

export function getFileProcessQueue(): Queue<FileProcessJobData> {
  if (queue) return queue
  queue = new Queue<FileProcessJobData>(FILE_PROCESS_QUEUE, {
    connection: getConnection(),
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 100 },
    },
  })
  return queue
}

export function createWorker(
  processor: Processor<FileProcessJobData>,
): Worker<FileProcessJobData> {
  return new Worker<FileProcessJobData>(FILE_PROCESS_QUEUE, processor, {
    connection: getConnection(),
    concurrency: Number(process.env.FILE_WORKER_CONCURRENCY ?? "2"),
  })
}
