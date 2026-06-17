import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProblemTable from '@/components/problems/ProblemTable'
import Navbar from '@/components/layout/Navbar'

export const dynamic = 'force-dynamic'

export default async function ProblemsPage() {
  const session = await getServerSession(authOptions)

  const [problems, topics] = await Promise.all([
    prisma.problem.findMany({
      where: { isPublished: true },
      include: {
        topics: { include: { topic: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.topic.findMany({ orderBy: { name: 'asc' } }),
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

  const initialProblems = problems.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    difficulty: p.difficulty,
    topics: p.topics.map((t) => ({ name: t.topic.name, slug: t.topic.slug })),
    submissionCount: p._count.submissions,
    userStatus: (acSet.has(p.id) ? 'ac' : triedSet.has(p.id) ? 'tried' : 'none') as 'ac' | 'tried' | 'none',
  }))

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main">
        <ProblemTable
          initialProblems={initialProblems}
          allTopics={topics.map((t) => ({ name: t.name, slug: t.slug }))}
        />
      </main>
    </div>
  )
}
