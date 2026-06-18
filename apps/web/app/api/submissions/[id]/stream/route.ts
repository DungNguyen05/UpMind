import { Redis } from 'ioredis'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { id: string } }) {
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
