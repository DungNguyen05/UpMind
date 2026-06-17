import { Redis } from 'ioredis'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const redis = new Redis(process.env.REDIS_URL!)
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

      await redis.subscribe(`submission:${params.id}`)
      redis.on('message', (_channel, message) => {
        try {
          const payload = JSON.parse(message)
          send(payload)
          if (payload.verdict && payload.verdict !== 'pending') {
            redis.unsubscribe()
            redis.quit()
            controller.close()
          }
        } catch {}
      })

      req.signal.addEventListener('abort', () => {
        redis.unsubscribe()
        redis.quit()
        try { controller.close() } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
