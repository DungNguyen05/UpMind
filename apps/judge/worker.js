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
    const totalTests = problem.testCases.length
    const aiFeedbackQueued = Boolean(process.env.LLM_API_KEY)
    let completedTests = 0, passedTests = 0, failedTests = 0

    const publishProgress = async (extra = {}) => {
      const progress = totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 100
      await redisPublisher.publish(
        `submission:${submissionId}`,
        JSON.stringify({
          verdict: 'pending',
          status: 'running',
          totalTests,
          completedTests,
          passedTests,
          failedTests,
          progress,
          ...extra,
        })
      )
    }

    await publishProgress()

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
        failedTests = 1
        break
      }
      finalRuntimeMs = Math.max(finalRuntimeMs, result.runtimeMs || 0)

      if (result.verdict !== 'AC') {
        finalVerdict = result.verdict
        failedTestInput = tc.isSample ? tc.input : '(hidden)'
        failedTestOutput = result.actualOutput
        completedTests += 1
        failedTests = 1
        await publishProgress()
        break
      }

      completedTests += 1
      passedTests += 1
      await publishProgress()
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
      JSON.stringify({
        verdict: finalVerdict,
        runtimeMs: finalRuntimeMs,
        memoryKb: finalMemoryKb,
        totalTests,
        completedTests: finalVerdict === 'CE' ? totalTests : completedTests,
        passedTests,
        failedTests: finalVerdict === 'CE' ? Math.max(1, totalTests) : failedTests,
        progress: finalVerdict === 'AC' ? 100 : totalTests > 0 ? Math.round(((finalVerdict === 'CE' ? totalTests : completedTests) / totalTests) * 100) : 100,
        aiFeedbackQueued,
      })
    )

    if (aiFeedbackQueued) {
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
