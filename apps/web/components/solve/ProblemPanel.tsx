'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import Badge from '@/components/ui/Badge'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface TestCase {
  input: string
  expectedOutput: string
}

interface Problem {
  id: string
  title: string
  slug: string
  difficulty: string
  timeLimitMs: number
  memoryLimitMb: number
  description: string
  topics: { name: string; slug: string }[]
  testCases: TestCase[]
}

interface Submission {
  id: string
  verdict: string
  runtimeMs: number | null
  memoryKb: number | null
  submittedAt: string
  language: string
}

interface Props {
  problem: Problem
  userSubmissions: Submission[]
}

export default function ProblemPanel({ problem, userSubmissions }: Props) {
  const [tab, setTab] = useState<'statement' | 'submissions'>('statement')

  return (
    <div className="solve-col">
      <div className="col-head">
        <div className="tabs">
          <button className={tab === 'statement' ? 'active' : ''} onClick={() => setTab('statement')}>
            Đề bài
          </button>
          <button className={tab === 'submissions' ? 'active' : ''} onClick={() => setTab('submissions')}>
            Lịch sử nộp
          </button>
        </div>
        <Badge verdict={problem.difficulty} />
      </div>

      {tab === 'statement' && (
        <div className="statement">
          <h2>{problem.title}</h2>
          <div className="chip-row" style={{ marginBottom: 14 }}>
            {problem.topics.map((t) => <span key={t.slug} className="tag">{t.name}</span>)}
            <span className="pill">⏱ {problem.timeLimitMs}ms</span>
            <span className="pill">💾 {problem.memoryLimitMb}MB</span>
          </div>
          <ReactMarkdown>{problem.description}</ReactMarkdown>

          {problem.testCases.length > 0 && (
            <>
              <h3>Ví dụ</h3>
              {problem.testCases.map((tc, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Input {i + 1}</div>
                      <div className="code-block" style={{ position: 'relative' }}>
                        <pre style={{ margin: 0 }}>{tc.input}</pre>
                        <button
                          className="copy-btn ghost-btn"
                          onClick={() => navigator.clipboard?.writeText(tc.input)}
                        >
                          copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Output {i + 1}</div>
                      <div className="code-block">
                        <pre style={{ margin: 0 }}>{tc.expectedOutput}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {tab === 'submissions' && (
        <div style={{ padding: 14 }}>
          {userSubmissions.length === 0 ? (
            <p className="muted">Chưa có lần nộp nào.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Verdict</th>
                  <th>Runtime</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {userSubmissions.map((s) => (
                  <tr key={s.id} data-row>
                    <td><Badge verdict={s.verdict} /></td>
                    <td className="mono">{s.runtimeMs != null ? `${s.runtimeMs}ms` : '—'}</td>
                    <td className="muted" style={{ fontSize: 12 }}>
                      {formatDistanceToNow(new Date(s.submittedAt), { locale: vi, addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
