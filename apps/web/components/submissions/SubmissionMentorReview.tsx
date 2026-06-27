'use client'

import Badge from '@/components/ui/Badge'
import LazyMarkdown from '@/components/ui/LazyMarkdown'
import { useToast } from '@/components/ui/Toast'

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

const VERDICT_LABEL: Record<string, string> = {
  AC: 'Accepted',
  WA: 'Wrong Answer',
  TLE: 'Time Limit Exceeded',
  MLE: 'Memory Limit Exceeded',
  RE: 'Runtime Error',
  CE: 'Compile Error',
}

function fmtMs(ms: number | null) {
  return ms != null ? `${ms} ms` : '—'
}

function fmtMem(kb: number | null) {
  return kb != null ? `${Math.round(kb / 1024)} MB` : '—'
}

export default function SubmissionMentorReview({ submission }: { submission: Submission }) {
  const toast = useToast()
  const canCopy = Boolean(submission.failedTestInput && submission.failedTestInput !== '(hidden)')
  const showEvidence = submission.verdict !== 'AC' && (submission.compileError || submission.failedTestInput)

  return (
    <aside className="panel mentor-review">
      <div className="panel-head">
        <div>
          <span className="kicker">AI Mentor</span>
          <h2>Code Review</h2>
        </div>
        <Badge verdict={submission.verdict} />
      </div>

      <div className="verdict-card" style={{ marginBottom: 16 }}>
        <div className="verdict-card-left">
          <Badge verdict={submission.verdict} />
          <span className="verdict-label">
            {VERDICT_LABEL[submission.verdict] ?? submission.verdict}
          </span>
        </div>
        <div className="verdict-metrics">
          <span>{fmtMs(submission.runtimeMs)}</span>
          <span>·</span>
          <span>{fmtMem(submission.memoryKb)}</span>
        </div>
      </div>

      {submission.aiFeedback?.content ? (
        <div className="mentor-answer">
          <LazyMarkdown>{submission.aiFeedback.content}</LazyMarkdown>
        </div>
      ) : (
        <p className="muted" style={{ fontSize: 14 }}>
          AI feedback chưa khả dụng. Kiểm tra cấu hình <code>LLM_API_KEY</code>.
        </p>
      )}

      {showEvidence && (
        <div style={{ marginTop: 20 }}>
          <div className="evidence-label">Test lỗi</div>
          {submission.compileError ? (
            <pre className="code-block">{submission.compileError}</pre>
          ) : submission.failedTestInput ? (
            <>
              <div className="test-pack">
                <pre>{submission.failedTestInput}</pre>
                {canCopy && (
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(submission.failedTestInput ?? '')
                      toast('Đã copy input lỗi.', 'success')
                    }}
                  >
                    Copy
                  </button>
                )}
              </div>
              {submission.failedTestOutput && (
                <div style={{ marginTop: 10 }}>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Output của code</div>
                  <pre className="code-block">{submission.failedTestOutput}</pre>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </aside>
  )
}
