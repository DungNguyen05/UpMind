import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getJudgeQueue } from '@/lib/queue'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { problemId, code } = await req.json()
    if (!problemId || !code) return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })

    const submission = await prisma.submission.create({
      data: { userId: session.user.id, problemId, code, verdict: 'pending' },
    })

    await getJudgeQueue().add('judge', { submissionId: submission.id })
    return NextResponse.json({ submissionId: submission.id }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const problemId = searchParams.get('problemId')
    const verdict = searchParams.get('verdict')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = 20

    const where: any = { userId: session.user.id }
    if (problemId) where.problemId = problemId
    if (verdict) where.verdict = verdict

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          problem: { select: { id: true, title: true, slug: true } },
          aiFeedback: { select: { content: true, feedbackType: true } },
        },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.submission.count({ where }),
    ])

    return NextResponse.json({ submissions, total })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
