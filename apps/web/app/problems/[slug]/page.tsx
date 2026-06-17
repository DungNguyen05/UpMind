import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/layout/Navbar'
import ProblemPanel from '@/components/solve/ProblemPanel'
import Editor from '@/components/solve/Editor'
import AiPanel from '@/components/solve/AiPanel'
import StatusBar from '@/components/solve/StatusBar'

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

  let userSubmissions: any[] = []
  if (session?.user?.id) {
    userSubmissions = await prisma.submission.findMany({
      where: { userId: session.user.id, problemId: problem.id },
      orderBy: { submittedAt: 'desc' },
      take: 20,
      select: { id: true, verdict: true, runtimeMs: true, memoryKb: true, submittedAt: true, language: true },
    })
  }

  const problemData = {
    id: problem.id,
    title: problem.title,
    slug: problem.slug,
    difficulty: problem.difficulty,
    timeLimitMs: problem.timeLimitMs,
    memoryLimitMb: problem.memoryLimitMb,
    description: problem.description,
    topics: problem.topics.map((t) => ({ name: t.topic.name, slug: t.topic.slug })),
    testCases: problem.testCases.map((tc) => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
    })),
  }

  return (
    <div className="solve-page">
      <Navbar compact />
      <div className="solve-shell">
        <ProblemPanel problem={problemData} userSubmissions={userSubmissions} />
        <Editor problemId={problem.id} problemSlug={problem.slug} />
        <AiPanel problemSlug={problem.slug} problemTitle={problem.title} />
      </div>
      <StatusBar problemId={problem.id} />
    </div>
  )
}
