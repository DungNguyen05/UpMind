'use client'

import { useState } from 'react'
import Link from 'next/link'
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
            Submission
          </button>
        </div>
      </div>

      {tab === 'statement' && (
        <div className="statement">
          <div className="problem-title">
            <div>
              <span className="kicker">{problem.slug}</span>
              <h2>{problem.title}</h2>
            </div>
            <Badge verdict={problem.difficulty} />
          </div>

          <div className="statement-meta">
            {problem.topics.map((topic) => <span key={topic.slug} className="tag active">{topic.name}</span>)}
            <span className="pill">Time {problem.timeLimitMs}ms</span>
            <span className="pill">Memory {problem.memoryLimitMb}MB</span>
          </div>

          <ReactMarkdown className="problem-md">{problem.description}</ReactMarkdown>

          {problem.testCases.length > 0 && (
            <section className="problem-examples">
              {problem.testCases.map((testCase, index) => (
                <div key={index} className="problem-example">
                  <h3>Ví dụ {index + 1}</h3>
                  <pre id={`sample-${index + 1}`}>{testCase.input}</pre>
                  <button
                    className="copy-btn ghost-btn"
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(testCase.input)}
                  >
                    Copy
                  </button>
                  <p className="muted">
                    Output: <code>{testCase.expectedOutput}</code>
                  </p>
                </div>
              ))}
            </section>
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {userSubmissions.map((submission) => (
                  <tr key={submission.id} data-row>
                    <td><Badge verdict={submission.verdict} /></td>
                    <td className="mono">{submission.runtimeMs != null ? `${submission.runtimeMs}ms` : '—'}</td>
                    <td className="muted" style={{ fontSize: 12 }}>
                      {formatDistanceToNow(new Date(submission.submittedAt), { locale: vi, addSuffix: true })}
                    </td>
                    <td>
                      <Link href={`/submissions/${submission.id}`} className="ghost-btn" style={{ fontSize: 12 }}>
                        Review AI
                      </Link>
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
