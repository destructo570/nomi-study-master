import { Queue, Worker, type Processor } from "bullmq"

import { getConnection } from "./index"

export const SOURCE_EMBED_QUEUE = "source-embed"

export type EmbedJobData = {
  sourceId: string
}

let queue: Queue<EmbedJobData> | null = null

export function getSourceEmbedQueue(): Queue<EmbedJobData> {
  if (queue) return queue
  queue = new Queue<EmbedJobData>(SOURCE_EMBED_QUEUE, {
    connection: getConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 10_000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 100 },
    },
  })
  return queue
}

export function createEmbedWorker(
  processor: Processor<EmbedJobData>,
): Worker<EmbedJobData> {
  return new Worker<EmbedJobData>(SOURCE_EMBED_QUEUE, processor, {
    connection: getConnection(),
    concurrency: Number(process.env.EMBED_WORKER_CONCURRENCY ?? "1"),
  })
}
