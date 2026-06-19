'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Navbar from '@/components/layout/Navbar'
import Badge from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/time'

interface Submission {
  id: string
  verdict: string
  runtimeMs: number | null
  memoryKb: number | null
  submittedAt: string
  language: string
  code: string
  compileError: string | null
  failedTestInput: string | null
  failedTestOutput: string | null
  problem: { title: string; slug: string }
  aiFeedback: { content: string; feedbackType: string } | null
}

const SubmissionMentorReview = dynamic(() => import('@/components/submissions/SubmissionMentorReview'), {
  ssr: false,
  loading: () => (
    <aside className="panel mentor-review">
      <div className="skeleton" style={{ height: 120, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 220 }} />
    </aside>
  ),
})

function memoryText(memoryKb: number | null) {
  return memoryKb != null ? `${Math.round(memoryKb / 1024)}MB` : '—'
}

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/submissions/${params.id}`)
      .then((response) => {
        if (!response.ok) throw new Error('Not found')
        return response.json()
      })
      .then(setSubmission)
      .catch(() => router.push('/submissions'))
      .finally(() => setLoading(false))
  }, [params.id, router])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Đang tải...</div>
  if (!submission) return null

  function useCode() {
    localStorage.setItem(`prefillCode:${submission!.problem.slug}`, submission!.code)
    router.push(`/problems/${submission!.problem.slug}`)
  }

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main wide-main">
        <div className="page-head">
          <div className="page-title">
            <Link className="muted" href="/submissions" prefetch={false} style={{ fontSize: 13 }}>← Quay lại lịch sử</Link>
            <h1 style={{ marginTop: 6 }}>
              {submission.problem.title} <Badge verdict={submission.verdict} />
            </h1>
            <p className="muted" style={{ marginTop: 4 }}>
              {formatRelativeTime(submission.submittedAt)} · {submission.language}
            </p>
          </div>
          <button className="primary-btn" onClick={useCode}>Dùng code này</button>
        </div>

        <div className="metric-grid">
          <div className="metric"><span>Runtime</span><strong>{submission.runtimeMs != null ? `${submission.runtimeMs}ms` : '—'}</strong></div>
          <div className="metric"><span>Memory</span><strong>{memoryText(submission.memoryKb)}</strong></div>
          <div className="metric"><span>Language</span><strong>{submission.language}</strong></div>
          <div className="metric"><span>Verdict</span><Badge verdict={submission.verdict} /></div>
        </div>

        <div className="submission-review">
          <SubmissionMentorReview submission={submission} />

          <section className="panel">
            <div className="panel-head">
              <h2>Code đã nộp</h2>
              <span className="badge ce">Read-only</span>
            </div>
            <pre className="submitted-code">{submission.code}</pre>

            {submission.compileError && (
              <section className="mentor-section">
                <h3>Compile Error</h3>
                <pre className="code-block" style={{ color: 'var(--danger)' }}>{submission.compileError}</pre>
              </section>
            )}

            {submission.failedTestInput && (
              <section className="mentor-section">
                <h3>Bằng chứng từ judge</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Input</div>
                    <pre className="code-block">{submission.failedTestInput}</pre>
                  </div>
                  <div>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Output của bạn</div>
                    <pre className="code-block">{submission.failedTestOutput ?? '(empty)'}</pre>
                  </div>
                </div>
              </section>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
