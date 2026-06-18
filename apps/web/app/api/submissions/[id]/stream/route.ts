import { Redis } from 'ioredis'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: {
      problem: { select: { _count: { select: { testCases: true } } } },
    },
  })
  if (!submission) return new Response('Không tìm thấy', { status: 404 })
  if (submission.userId !== session.user.id && session.user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 })
  }

  const makePayload = (current: typeof submission) => {
    const totalTests = current.problem._count.testCases
    const isDone = current.verdict !== 'pending'
    return {
      verdict: current.verdict,
      runtimeMs: current.runtimeMs,
      memoryKb: current.memoryKb,
      totalTests,
      completedTests: isDone ? totalTests : 0,
      passedTests: current.verdict === 'AC' ? totalTests : 0,
      failedTests: isDone && current.verdict !== 'AC' ? Math.max(1, totalTests) : 0,
      progress: isDone ? 100 : 0,
    }
  }

  const redis = new Redis(process.env.REDIS_URL!)
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false
      let closeTimer: ReturnType<typeof setTimeout> | null = null

      const cleanup = () => {
        if (closed) return
        closed = true
        if (closeTimer) clearTimeout(closeTimer)
        redis.unsubscribe().catch(() => {})
        redis.quit().catch(() => {})
        try { controller.close() } catch {}
      }

      const send = (data: object) => {
        if (!closed) controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      await redis.subscribe(`submission:${params.id}`)

      const latestSubmission = await prisma.submission.findUnique({
        where: { id: params.id },
        include: {
          problem: { select: { _count: { select: { testCases: true } } } },
        },
      })
      const latestPayload = makePayload(latestSubmission ?? submission)
      send(latestPayload)
      if (latestPayload.verdict !== 'pending') {
        closeTimer = setTimeout(cleanup, 60000)
      }

      redis.on('message', (_channel, message) => {
        try {
          const payload = JSON.parse(message)
          send(payload)
          if (payload.aiFeedbackReady) {
            cleanup()
            return
          }
          if (payload.verdict && payload.verdict !== 'pending') {
            closeTimer = setTimeout(cleanup, 60000)
          }
        } catch {}
      })

      req.signal.addEventListener('abort', cleanup)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
