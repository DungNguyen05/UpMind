import { prisma } from '@/lib/prisma'
import Navbar from '@/components/layout/Navbar'
import AdminProblemsTable from './AdminProblemsTable'

export const dynamic = 'force-dynamic'

export default async function AdminProblemsPage() {
  const problems = await prisma.problem.findMany({
    include: { topics: { include: { topic: true } }, _count: { select: { submissions: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main">
        <AdminProblemsTable
          problems={problems.map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            difficulty: p.difficulty,
            isPublished: p.isPublished,
            submissionCount: p._count.submissions,
            topics: p.topics.map((t) => t.topic.name),
          }))}
        />
      </main>
    </div>
  )
}
