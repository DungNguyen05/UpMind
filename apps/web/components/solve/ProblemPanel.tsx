'use client'

import { useState } from 'react'
import Link from 'next/link'
import LazyMarkdown from '@/components/ui/LazyMarkdown'
import ProblemExamples from '@/components/ui/ProblemExamples'
import Badge from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/time'

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

          <LazyMarkdown className="problem-md">{problem.description}</LazyMarkdown>

          {problem.testCases.length > 0 && <ProblemExamples examples={problem.testCases} />}
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
                      {formatRelativeTime(submission.submittedAt)}
                    </td>
                    <td>
                      <Link href={`/submissions/${submission.id}`} prefetch={false} className="ghost-btn" style={{ fontSize: 12 }}>
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
