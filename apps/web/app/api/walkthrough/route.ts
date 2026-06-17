import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { streamLLMResponse } from '@/lib/llm'
import { buildWalkthroughSystemPrompt } from '@/lib/prompts'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { problemSlug, fullCode, selectedLine, lineNumber } = await req.json()

    const problem = await prisma.problem.findUnique({ where: { slug: problemSlug } })
    if (!problem) return NextResponse.json({ error: 'Không tìm thấy bài' }, { status: 404 })

    const systemPrompt = buildWalkthroughSystemPrompt(problem.title, problem.description)
    const userMessage = `Giải thích dòng ${lineNumber} trong code của tôi:\n\`\`\`cpp\n${selectedLine}\n\`\`\`\n\nToàn bộ code:\n\`\`\`cpp\n${fullCode}\n\`\`\``

    const stream = await streamLLMResponse(systemPrompt, [{ role: 'user', content: userMessage }])

    return new Response(stream, {
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
