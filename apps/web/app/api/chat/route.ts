import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { streamLLMResponse } from '@/lib/llm'
import { buildChatSystemPrompt } from '@/lib/prompts'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { problemSlug, submissionId, messages } = await req.json()

    const problem = await prisma.problem.findUnique({ where: { slug: problemSlug } })
    if (!problem) return NextResponse.json({ error: 'Không tìm thấy bài' }, { status: 404 })

    const userMessage = messages[messages.length - 1]?.content ?? ''

    await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        problemId: problem.id,
        submissionId: submissionId ?? null,
        role: 'user',
        content: userMessage,
      },
    })

    const systemPrompt = buildChatSystemPrompt(problem.title, problem.description)
    const stream = await streamLLMResponse(systemPrompt, messages)

    // Collect full response then save async
    const [stream1, stream2] = stream.tee()
    ;(async () => {
      try {
        const reader = stream2.getReader()
        const decoder = new TextDecoder()
        let full = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          for (const line of chunk.split('\n')) {
            if (line.startsWith('data: ')) full += line.slice(6)
          }
        }
        if (full) {
          await prisma.chatMessage.create({
            data: {
              userId: session.user.id,
              problemId: problem.id,
              submissionId: submissionId ?? null,
              role: 'assistant',
              content: full,
            },
          })
        }
      } catch {}
    })()

    return new Response(stream1, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
