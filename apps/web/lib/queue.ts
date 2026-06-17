import { Queue } from 'bullmq'

let judgeQueue: Queue | null = null

function redisOpts() {
  const url = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379')
  return {
    host: url.hostname,
    port: parseInt(url.port || '6379'),
    password: url.password || undefined,
    maxRetriesPerRequest: null as null,
  }
}

export function getJudgeQueue() {
  if (!judgeQueue) {
    judgeQueue = new Queue('judge-queue', { connection: redisOpts() })
  }
  return judgeQueue
}
