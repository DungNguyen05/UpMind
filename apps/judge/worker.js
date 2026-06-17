const { Worker, Queue } = require('bullmq')
const { Redis } = require('ioredis')
const { PrismaClient } = require('@prisma/client')
const { runInSandbox } = require('./sandbox')

const prisma = new PrismaClient()
const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
const redisPublisher = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })

const judgeWorker = new Worker(
  'judge-queue',
  async (job) => {
    const { submissionId } = job.data
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        problem: { include: { testCases: { orderBy: { orderIndex: 'asc' } } } },
      },
    })
    if (!submission) return

    const { problem } = submission
    let finalVerdict = 'AC'
    let finalRuntimeMs = 0, finalMemoryKb = null
    let failedTestInput = null, failedTestOutput = null, compileError = null

    for (const tc of problem.testCases) {
      const result = await runInSandbox({
        code: submission.code,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb,
      })

      if (result.verdict === 'CE') {
        finalVerdict = 'CE'
        compileError = result.compileError
        break
      }
      finalRuntimeMs = Math.max(finalRuntimeMs, result.runtimeMs || 0)

      if (result.verdict !== 'AC') {
        finalVerdict = result.verdict
        failedTestInput = tc.isSample ? tc.input : '(hidden)'
        failedTestOutput = result.actualOutput
        break
      }
    }

    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        verdict: finalVerdict,
        runtimeMs: finalRuntimeMs || null,
        memoryKb: finalMemoryKb,
        compileError,
        failedTestInput,
        failedTestOutput,
      },
    })

    await redisPublisher.publish(
      `submission:${submissionId}`,
      JSON.stringify({ verdict: finalVerdict, runtimeMs: finalRuntimeMs, memoryKb: finalMemoryKb })
    )

    if (process.env.LLM_API_KEY) {
      const aiQueue = new Queue('ai-queue', { connection: redis })
      await aiQueue.add('analyze', {
        submissionId,
        verdict: finalVerdict,
        code: submission.code,
        problemDescription: problem.description,
        timeLimitMs: problem.timeLimitMs,
        failedTestInput,
        failedTestOutput,
        compileError,
      })
    }
  },
  { connection: redis }
)

judgeWorker.on('failed', (job, err) => console.error('Judge job failed:', job?.id, err))
console.log('Judge worker started')

// Start LLM worker in same process
require('./llm-worker')
