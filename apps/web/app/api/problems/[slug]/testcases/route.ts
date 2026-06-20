import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function normalizeTestCases(testCases: any[], problemId: string) {
  return testCases.map((tc: any, i: number) => ({
    problemId,
    input: String(tc.input ?? ''),
    expectedOutput: String(tc.expectedOutput ?? ''),
    isSample: tc.isSample ?? false,
    orderIndex: i,
  }))
}

async function findAdminProblem(slug: string) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  const problem = await prisma.problem.findUnique({ where: { slug } })
  if (!problem) {
    return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  }

  return { problem }
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const result = await findAdminProblem(params.slug)
    if ('error' in result) return result.error
    const { problem } = result

    const { testCases } = await req.json()
    if (!Array.isArray(testCases)) {
      return NextResponse.json({ error: 'Invalid test cases' }, { status: 400 })
    }

    const created = await prisma.testCase.createMany({
      data: normalizeTestCases(testCases, problem.id),
    })
    return NextResponse.json({ created: created.count })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { slug: string } }) {
  try {
    const result = await findAdminProblem(params.slug)
    if ('error' in result) return result.error
    const { problem } = result

    const { testCases } = await req.json()
    if (!Array.isArray(testCases)) {
      return NextResponse.json({ error: 'Invalid test cases' }, { status: 400 })
    }

    const replacement = normalizeTestCases(testCases, problem.id)
    await prisma.$transaction([
      prisma.testCase.deleteMany({ where: { problemId: problem.id } }),
      ...(replacement.length ? [prisma.testCase.createMany({ data: replacement })] : []),
    ])

    return NextResponse.json({ updated: replacement.length })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
