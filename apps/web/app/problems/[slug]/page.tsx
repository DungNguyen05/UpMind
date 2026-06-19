import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/layout/Navbar'
import SolveWorkspace from '@/components/solve/SolveWorkspace'
import Providers from '@/app/providers'

export const dynamic = 'force-dynamic'

interface Props {
  params: { slug: string }
}

export default async function SolvePage({ params }: Props) {
  const session = await getServerSession(authOptions)
  const problem = await prisma.problem.findUnique({
    where: { slug: params.slug, isPublished: true },
    include: {
      topics: { include: { topic: true } },
      testCases: { where: { isSample: true }, orderBy: { orderIndex: 'asc' } },
    },
  })
  if (!problem) notFound()

  let userSubmissions: Array<{
    id: string
    verdict: string
    runtimeMs: number | null
    memoryKb: number | null
    submittedAt: string
    language: string
  }> = []
  let latestSubmission = null

  if (session?.user?.id) {
    const submissions = await prisma.submission.findMany({
      where: { userId: session.user.id, problemId: problem.id },
      orderBy: { submittedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        verdict: true,
        runtimeMs: true,
        memoryKb: true,
        submittedAt: true,
        language: true,
        compileError: true,
        failedTestInput: true,
        failedTestOutput: true,
        aiFeedback: { select: { content: true, feedbackType: true } },
      },
    })

    userSubmissions = submissions.map((submission) => ({
      id: submission.id,
      verdict: submission.verdict,
      runtimeMs: submission.runtimeMs,
      memoryKb: submission.memoryKb,
      submittedAt: submission.submittedAt.toISOString(),
      language: submission.language,
    }))

    const first = submissions[0]
    latestSubmission = first
      ? {
          id: first.id,
          verdict: first.verdict,
          runtimeMs: first.runtimeMs,
          memoryKb: first.memoryKb,
          submittedAt: first.submittedAt.toISOString(),
          language: first.language,
          compileError: first.compileError,
          failedTestInput: first.failedTestInput,
          failedTestOutput: first.failedTestOutput,
          aiFeedback: first.aiFeedback,
        }
      : null
  }

  const problemData = {
    id: problem.id,
    title: problem.title,
    slug: problem.slug,
    difficulty: problem.difficulty,
    timeLimitMs: problem.timeLimitMs,
    memoryLimitMb: problem.memoryLimitMb,
    description: problem.description,
    topics: problem.topics.map((item) => ({ name: item.topic.name, slug: item.topic.slug })),
    testCases: problem.testCases.map((testCase) => ({
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
    })),
  }

  return (
    <Providers session={session}>
      <div className="solve-page">
        <Navbar compact />
        <SolveWorkspace
          problem={problemData}
          userSubmissions={userSubmissions}
          initialLatestSubmission={latestSubmission}
        />
      </div>
    </Providers>
  )
}
