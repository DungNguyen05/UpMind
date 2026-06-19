'use client'

import { useState } from 'react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'

interface Problem {
  id: string
  title: string
  slug: string
  difficulty: string
  isPublished: boolean
  submissionCount: number
  topics: string[]
}

export default function AdminProblemsTable({ problems: initial }: { problems: Problem[] }) {
  const [problems, setProblems] = useState(initial)
  const toast = useToast()
  const router = useRouter()

  async function togglePublished(slug: string, current: boolean) {
    const res = await fetch(`/api/problems/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !current }),
    })
    if (res.ok) {
      setProblems((prev) => prev.map((p) => p.slug === slug ? { ...p, isPublished: !current } : p))
      toast(!current ? 'Đã publish bài' : 'Đã chuyển về draft', 'success')
    }
  }

  async function deleteProblem(slug: string) {
    if (!confirm('Xóa bài này?')) return
    const res = await fetch(`/api/problems/${slug}`, { method: 'DELETE' })
    if (res.ok) {
      setProblems((prev) => prev.filter((p) => p.slug !== slug))
      toast('Đã xóa bài', 'success')
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="page-title"><h1>Quản lý bài tập</h1></div>
        <Link href="/admin/problems/new" prefetch={false} className="primary-btn">+ Thêm bài</Link>
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Tên bài</th>
              <th>Độ khó</th>
              <th>Nộp bài</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((p) => (
              <tr key={p.id} data-row>
                <td>
                  <div className="problem-name">{p.title}</div>
                  <div className="sub-tags">{p.topics.map((t) => <span key={t}>{t}</span>)}</div>
                </td>
                <td><Badge verdict={p.difficulty} /></td>
                <td className="mono">{p.submissionCount}</td>
                <td>
                  <button
                    className={`switch${p.isPublished ? ' on' : ''}`}
                    onClick={() => togglePublished(p.slug, p.isPublished)}
                    title={p.isPublished ? 'Published' : 'Draft'}
                  />
                </td>
                <td>
                  <div className="row">
                    <Link href={`/admin/problems/${p.slug}/edit`} prefetch={false} className="secondary-btn" style={{ fontSize: 12 }}>
                      Sửa
                    </Link>
                    <button className="ghost-btn" style={{ fontSize: 12, color: 'var(--danger)' }} onClick={() => deleteProblem(p.slug)}>
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
