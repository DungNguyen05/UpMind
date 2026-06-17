import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') ?? ''
    const difficulty = searchParams.get('difficulty') ?? ''
    const topics = searchParams.get('topics')?.split(',').filter(Boolean) ?? []
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = parseInt(searchParams.get('limit') ?? '20')

    const where: any = { isPublished: true }
    if (search) where.title = { contains: search, mode: 'insensitive' }
    if (difficulty) where.difficulty = difficulty
    if (topics.length) {
      where.topics = { some: { topic: { slug: { in: topics } } } }
    }

    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        include: {
          topics: { include: { topic: true } },
          _count: { select: { submissions: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.problem.count({ where }),
    ])

    let userSubmissions: any[] = []
    if (session?.user?.id) {
      userSubmissions = await prisma.submission.findMany({
        where: { userId: session.user.id, problemId: { in: problems.map((p) => p.id) } },
        select: { problemId: true, verdict: true },
      })
    }

    const acSet = new Set(userSubmissions.filter((s) => s.verdict === 'AC').map((s) => s.problemId))
    const triedSet = new Set(userSubmissions.map((s) => s.problemId))

    const result = problems.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      topics: p.topics.map((t) => ({ name: t.topic.name, slug: t.topic.slug })),
      submissionCount: p._count.submissions,
      userStatus: acSet.has(p.id) ? 'ac' : triedSet.has(p.id) ? 'tried' : 'none',
    }))

    return NextResponse.json({ problems: result, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    console.error('GET /api/problems error:', err)
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { title, slug, difficulty, description, timeLimitMs, memoryLimitMb, topicSlugs } = await req.json()
    const problem = await prisma.problem.create({
      data: {
        title,
        slug,
        difficulty,
        description,
        timeLimitMs: timeLimitMs ?? 1000,
        memoryLimitMb: memoryLimitMb ?? 256,
        createdById: session.user.id,
        topics: {
          create: topicSlugs
            ? await Promise.all(
                topicSlugs.map(async (s: string) => {
                  const topic = await prisma.topic.findUnique({ where: { slug: s } })
                  return { topicId: topic!.id }
                })
              )
            : [],
        },
      },
    })
    return NextResponse.json(problem, { status: 201 })
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'Slug đã tồn tại' }, { status: 409 })
    console.error('POST /api/problems error:', err)
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
