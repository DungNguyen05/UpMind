import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === 'admin'
    const problem = await prisma.problem.findUnique({
      where: { slug: params.slug },
      include: {
        topics: { include: { topic: true } },
        testCases: {
          ...(isAdmin ? {} : { where: { isSample: true } }),
          orderBy: { orderIndex: 'asc' },
        },
      },
    })
    if (!problem) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })

    let userStatus = 'none'
    if (session?.user?.id) {
      const sub = await prisma.submission.findFirst({
        where: { userId: session.user.id, problemId: problem.id },
        orderBy: { submittedAt: 'desc' },
      })
      if (sub) userStatus = sub.verdict === 'AC' ? 'ac' : 'tried'
    }

    return NextResponse.json({
      ...problem,
      topics: problem.topics.map((t) => ({ name: t.topic.name, slug: t.topic.slug })),
      userStatus,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const data = await req.json()
    const problem = await prisma.problem.update({ where: { slug: params.slug }, data })
    return NextResponse.json(problem)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await prisma.problem.delete({ where: { slug: params.slug } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
