'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Badge from '@/components/ui/Badge'
import ReactMarkdown from 'react-markdown'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

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

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [sub, setSub] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/submissions/${params.id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then(setSub)
      .catch(() => router.push('/submissions'))
      .finally(() => setLoading(false))
  }, [params.id, router])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Đang tải...</div>
  if (!sub) return null

  function useCode() {
    localStorage.setItem(`prefillCode:${sub!.problem.slug}`, sub!.code)
    router.push(`/problems/${sub!.problem.slug}`)
  }

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main">
        <div className="page-head">
          <div className="page-title">
            <h1>{sub.problem.title}</h1>
            <p className="muted" style={{ marginTop: 4 }}>
              {formatDistanceToNow(new Date(sub.submittedAt), { locale: vi, addSuffix: true })}
            </p>
          </div>
          <div className="row">
            <Badge verdict={sub.verdict} />
            <button className="secondary-btn" onClick={useCode}>Dùng code này</button>
          </div>
        </div>

        <div className="metric-grid">
          <div className="metric"><span>Runtime</span><strong>{sub.runtimeMs != null ? `${sub.runtimeMs}ms` : '—'}</strong></div>
          <div className="metric"><span>Memory</span><strong>{sub.memoryKb != null ? `${Math.round(sub.memoryKb / 1024)}MB` : '—'}</strong></div>
          <div className="metric"><span>Ngôn ngữ</span><strong>{sub.language}</strong></div>
          <div className="metric"><span>Verdict</span><Badge verdict={sub.verdict} /></div>
        </div>

        <div className="split-2">
          <div className="panel">
            <div className="section-title">Code</div>
            <pre className="submitted-code">{sub.code}</pre>
            {sub.compileError && (
              <>
                <div className="section-title" style={{ marginTop: 12, color: 'var(--danger)' }}>Compile Error</div>
                <pre className="code-block" style={{ color: 'var(--danger)' }}>{sub.compileError}</pre>
              </>
            )}
            {sub.failedTestInput && (
              <>
                <div className="section-title" style={{ marginTop: 12 }}>Test case bị sai</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Input</div>
                    <pre className="code-block">{sub.failedTestInput}</pre>
                  </div>
                  <div>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Output của bạn</div>
                    <pre className="code-block">{sub.failedTestOutput ?? '(empty)'}</pre>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="panel">
            <div className="section-title">AI Feedback</div>
            {sub.aiFeedback ? (
              <ReactMarkdown>{sub.aiFeedback.content}</ReactMarkdown>
            ) : (
              <p className="muted">Không có AI feedback cho lần nộp này.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
