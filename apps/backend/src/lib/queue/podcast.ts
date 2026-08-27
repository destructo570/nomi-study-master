import { Queue, Worker, type Processor } from "bullmq"

import { getConnection } from "./index"

export const PODCAST_QUEUE = "podcast-generate"

export type PodcastJobData = {
  podcastId: string
}

let queue: Queue<PodcastJobData> | null = null

export function getPodcastQueue(): Queue<PodcastJobData> {
  if (queue) return queue
  queue = new Queue<PodcastJobData>(PODCAST_QUEUE, {
    connection: getConnection(),
    defaultJobOptions: {
      // No automatic retries: each attempt costs real TTS minutes. A failure
      // surfaces in the UI with a Try-again CTA so the user explicitly opts
      // in to a second spend.
      attempts: 1,
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 50 },
    },
  })
  return queue
}

export function createPodcastWorker(
  processor: Processor<PodcastJobData>,
): Worker<PodcastJobData> {
  return new Worker<PodcastJobData>(PODCAST_QUEUE, processor, {
    connection: getConnection(),
    concurrency: Number(process.env.PODCAST_WORKER_CONCURRENCY ?? "1"),
  })
}
