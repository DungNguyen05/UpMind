'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Badge from '@/components/ui/Badge'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Submission {
  id: string
  verdict: string
  runtimeMs: number | null
  memoryKb: number | null
  submittedAt: string
  language: string
  problem: { title: string; slug: string }
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
      .then((r) => r.json())
      .then((d) => { setSubmissions(d.submissions ?? []); setTotal(d.total ?? 0) })
      .finally(() => setLoading(false))
  }, [verdict])

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main">
        <div className="page-head">
          <div className="page-title"><h1>Nộp bài của tôi</h1></div>
          <span className="stat-chip">Tổng <strong>{total}</strong></span>
        </div>

        <div className="controls" style={{ gridTemplateColumns: 'auto' }}>
          <select
            className="search"
            style={{ width: 'auto', maxWidth: 200 }}
            value={verdict}
            onChange={(e) => setVerdict(e.target.value)}
          >
            <option value="all">Tất cả verdict</option>
            {['AC', 'WA', 'TLE', 'MLE', 'RE', 'CE', 'pending'].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        <div className="table-card">
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>Đang tải...</div>
          ) : submissions.length === 0 ? (
            <div className="empty"><strong>Chưa có lần nộp nào</strong></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Bài</th>
                  <th>Verdict</th>
                  <th>Runtime</th>
                  <th>Memory</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id} data-row>
                    <td className="muted" style={{ fontSize: 12 }}>
                      {formatDistanceToNow(new Date(s.submittedAt), { locale: vi, addSuffix: true })}
                    </td>
                    <td>
                      <Link href={`/problems/${s.problem.slug}`} style={{ fontWeight: 700 }}>
                        {s.problem.title}
                      </Link>
                    </td>
                    <td><Badge verdict={s.verdict} /></td>
                    <td className="mono">{s.runtimeMs != null ? `${s.runtimeMs}ms` : '—'}</td>
                    <td className="mono">{s.memoryKb != null ? `${Math.round(s.memoryKb / 1024)}MB` : '—'}</td>
                    <td>
                      <Link href={`/submissions/${s.id}`} prefetch={false} className="ghost-btn" style={{ fontSize: 12 }}>
                        Chi tiết
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
