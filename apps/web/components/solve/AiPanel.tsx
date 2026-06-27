'use client'

import Badge from '@/components/ui/Badge'
import LazyMarkdown from '@/components/ui/LazyMarkdown'

export interface MentorSubmission {
  id: string
  verdict: string
  runtimeMs: number | null
  memoryKb: number | null
  submittedAt: string
  language: string
  compileError?: string | null
  failedTestInput?: string | null
  failedTestOutput?: string | null
  aiFeedback?: { content: string; feedbackType: string | null } | null
  aiFeedbackLoading?: boolean
}

interface Props {
  latestSubmission?: MentorSubmission | null
  mobileOpen?: boolean
  onClose?: () => void
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

export default function AiPanel({ latestSubmission, mobileOpen, onClose }: Props) {
  const verdict = latestSubmission?.verdict
  const isPending = verdict === 'pending'
  const isAiLoading = Boolean(latestSubmission && !isPending && latestSubmission.aiFeedbackLoading)
  const hasFeedback = Boolean(latestSubmission?.aiFeedback?.content)

  return (
    <div className={`solve-col ai mentor-workspace ${mobileOpen ? 'open' : ''}`}>
      <div className="mentor-head compact">
        <div>
          <span className="kicker">AI Mentor</span>
          <h2>Code Review</h2>
        </div>
        <button
          className="ghost-btn icon-btn mentor-close"
          type="button"
          title="Ẩn AI Mentor"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="mentor-scroll">
        <div className="ai-panel">
          {!latestSubmission ? (
            <div className="mentor-empty-state">
              <div className="mentor-empty-icon">⬆</div>
              <strong>Nộp bài để nhận review</strong>
              <p>AI sẽ tự động phân tích code ngay sau khi chấm xong.</p>
            </div>
          ) : isPending ? (
            <div className="mentor-analyzing">
              <div className="mentor-pulse" />
              <span>Đang chấm bài...</span>
            </div>
          ) : isAiLoading ? (
            <div className="mentor-analyzing">
              <div className="loading-dots">
                <span /><span /><span />
              </div>
              <span>AI đang phân tích...</span>
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>Thường mất 5–10 giây</p>
            </div>
          ) : (
            <>
              <div className="verdict-card">
                <div className="verdict-card-left">
                  <Badge verdict={verdict ?? ''} />
                  <span className="verdict-label">
                    {VERDICT_LABEL[verdict ?? ''] ?? verdict}
                  </span>
                </div>
                <div className="verdict-metrics">
                  <span>{fmtMs(latestSubmission.runtimeMs)}</span>
                  <span>·</span>
                  <span>{fmtMem(latestSubmission.memoryKb)}</span>
                </div>
              </div>

              {hasFeedback ? (
                <div className="mentor-answer">
                  <LazyMarkdown>{latestSubmission.aiFeedback!.content}</LazyMarkdown>
                </div>
              ) : (
                <div className="mentor-empty-state" style={{ padding: '28px 16px' }}>
                  <div className="mentor-empty-icon" style={{ fontSize: 20 }}>—</div>
                  <p>AI feedback chưa khả dụng.<br />Kiểm tra cấu hình <code>LLM_API_KEY</code>.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
