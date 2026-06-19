'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Badge from '@/components/ui/Badge'
import { getMentorNextStep } from '@/lib/mentor'
import { formatRelativeTime } from '@/lib/time'

interface Submission {
  id: string
  verdict: string
  runtimeMs: number | null
  memoryKb: number | null
  submittedAt: string
  language: string
  compileError: string | null
  failedTestInput: string | null
  failedTestOutput: string | null
  problem: { id: string; title: string; slug: string }
  aiFeedback: { content: string; feedbackType: string } | null
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [total, setTotal] = useState(0)
  const [verdict, setVerdict] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (verdict !== 'all') params.set('verdict', verdict)
    setLoading(true)
    fetch(`/api/submissions?${params}`)
      .then((response) => response.json())
      .then((data) => {
        setSubmissions(data.submissions ?? [])
        setTotal(data.total ?? 0)
      })
      .finally(() => setLoading(false))
  }, [verdict])

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main wide-main">
        <div className="page-head">
          <div className="page-title">
            <h1>Lịch sử nộp bài</h1>
            <p className="muted">Mỗi submission là một checkpoint học tập: verdict, nguyên nhân và bước tiếp theo từ Mentor.</p>
          </div>
          <span className="stat-chip">Tổng <strong>{total}</strong></span>
        </div>

        <div className="controls" style={{ gridTemplateColumns: 'auto' }}>
          <select
            className="search"
            style={{ width: 'auto', maxWidth: 220 }}
            value={verdict}
            onChange={(event) => setVerdict(event.target.value)}
          >
            <option value="all">Tất cả verdict</option>
            {['AC', 'WA', 'TLE', 'MLE', 'RE', 'CE', 'pending'].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="table-card">
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>Đang tải...</div>
          ) : submissions.length === 0 ? (
            <div className="empty">
              <strong>Chưa có submission phù hợp</strong>
              <span>Đổi bộ lọc hoặc quay lại danh sách bài tập.</span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Bài</th>
                  <th>Verdict</th>
                  <th>Runtime</th>
                  <th>Memory</th>
                  <th>Mentor next step</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id} data-row>
                    <td className="muted" style={{ fontSize: 12 }}>
                      {formatRelativeTime(submission.submittedAt)}
                    </td>
                    <td>
                      <Link href={`/problems/${submission.problem.slug}`} prefetch={false} style={{ fontWeight: 700 }}>
                        {submission.problem.title}
                      </Link>
                    </td>
                    <td><Badge verdict={submission.verdict} /></td>
                    <td className="mono">{submission.runtimeMs != null ? `${submission.runtimeMs}ms` : '—'}</td>
                    <td className="mono">{submission.memoryKb != null ? `${Math.round(submission.memoryKb / 1024)}MB` : '—'}</td>
                    <td className="mentor-next">{getMentorNextStep(submission)}</td>
                    <td>
                      <Link href={`/submissions/${submission.id}`} prefetch={false} className="ghost-btn" style={{ fontSize: 12 }}>
                        Review với AI
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
