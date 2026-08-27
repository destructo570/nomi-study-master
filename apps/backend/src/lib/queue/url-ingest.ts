import { Queue, Worker, type Processor } from "bullmq"

import { getConnection } from "./index"

export const URL_INGEST_QUEUE = "url-ingest"

export type UrlIngestJobData = {
  sourceId: string
}

let queue: Queue<UrlIngestJobData> | null = null

export function getUrlIngestQueue(): Queue<UrlIngestJobData> {
  if (queue) return queue
  queue = new Queue<UrlIngestJobData>(URL_INGEST_QUEUE, {
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

export function createUrlIngestWorker(
  processor: Processor<UrlIngestJobData>,
): Worker<UrlIngestJobData> {
  return new Worker<UrlIngestJobData>(URL_INGEST_QUEUE, processor, {
    connection: getConnection(),
    concurrency: Number(process.env.URL_INGEST_CONCURRENCY ?? "4"),
  })
}
