import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const problem = await prisma.problem.findUnique({ where: { slug: params.slug } })
    if (!problem) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })

    const { testCases } = await req.json()
    const created = await prisma.testCase.createMany({
      data: testCases.map((tc: any, i: number) => ({
        problemId: problem.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isSample: tc.isSample ?? false,
        orderIndex: i,
      })),
    })
    return NextResponse.json({ created: created.count })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
