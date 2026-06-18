import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { streamLLMResponse } from '@/lib/llm'
import { buildChatSystemPrompt } from '@/lib/prompts'

export const dynamic = 'force-dynamic'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

function normalizeMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return []
  return messages
    .filter((message): message is ChatMessage => {
      if (!message || typeof message !== 'object') return false
      const item = message as Partial<ChatMessage>
      return (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string'
    })
    .slice(-12)
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { problemSlug, submissionId, messages, contextCode } = await req.json()
    const safeSubmissionId = typeof submissionId === 'string' && submissionId.length > 0 ? submissionId : null
    const cleanMessages = normalizeMessages(messages)
    if (!problemSlug || cleanMessages.length === 0) {
      return NextResponse.json({ error: 'Thiếu nội dung chat' }, { status: 400 })
    }

    const problem = await prisma.problem.findUnique({ where: { slug: problemSlug } })
    if (!problem) return NextResponse.json({ error: 'Không tìm thấy bài' }, { status: 404 })

    let submissionContext = null
    if (safeSubmissionId) {
      const submission = await prisma.submission.findUnique({
        where: { id: safeSubmissionId },
        include: {
          aiFeedback: { select: { content: true } },
          problem: { select: { id: true, slug: true } },
        },
      })
      if (!submission) return NextResponse.json({ error: 'Không tìm thấy submission' }, { status: 404 })
      if (submission.userId !== session.user.id && session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (submission.problem.slug !== problemSlug) {
        return NextResponse.json({ error: 'Submission không thuộc bài này' }, { status: 400 })
      }
      submissionContext = {
        verdict: submission.verdict,
        code: submission.code,
        language: submission.language,
        compileError: submission.compileError,
        failedTestInput: submission.failedTestInput,
        failedTestOutput: submission.failedTestOutput,
        aiFeedback: submission.aiFeedback?.content ?? null,
      }
    }

    const userMessage = cleanMessages[cleanMessages.length - 1]?.content ?? ''
    await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        problemId: problem.id,
        submissionId: safeSubmissionId,
        role: 'user',
        content: userMessage,
      },
    })

    const systemPrompt = buildChatSystemPrompt(problem.title, problem.description, {
      currentCode: typeof contextCode === 'string' ? contextCode : null,
      submission: submissionContext,
    })
    const stream = await streamLLMResponse(systemPrompt, cleanMessages)

    const [streamForClient, streamForSave] = stream.tee()
    ;(async () => {
      try {
        const reader = streamForSave.getReader()
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
              submissionId: safeSubmissionId,
              role: 'assistant',
              content: full,
            },
          })
        }
      } catch {}
    })()

    return new Response(streamForClient, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
