'use client'

import { useState, useEffect, useRef } from 'react'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import type { MentorSubmission } from './AiPanel'

interface Props {
  problemId: string
  onSubmissionUpdate?: (submission: MentorSubmission) => void
}

function toMentorSubmission(data: any): MentorSubmission {
  return {
    id: data.id,
    verdict: data.verdict,
    runtimeMs: data.runtimeMs ?? null,
    memoryKb: data.memoryKb ?? null,
    submittedAt: data.submittedAt ?? new Date().toISOString(),
    language: data.language ?? 'cpp17',
    compileError: data.compileError ?? null,
    failedTestInput: data.failedTestInput ?? null,
    failedTestOutput: data.failedTestOutput ?? null,
    aiFeedback: data.aiFeedback
      ? { content: data.aiFeedback.content, feedbackType: data.aiFeedback.feedbackType ?? null }
      : null,
  }
}

export default function StatusBar({ problemId, onSubmissionUpdate }: Props) {
  const toast = useToast()
  const [verdict, setVerdict] = useState<string | null>(null)
  const [runtimeMs, setRuntimeMs] = useState<number | null>(null)
  const [memoryKb, setMemoryKb] = useState<number | null>(null)
  const [status, setStatus] = useState('Sẵn sàng')
  const [testProgress, setTestProgress] = useState({
    total: 0,
    completed: 0,
    passed: 0,
    failed: 0,
    known: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const esRef = useRef<EventSource | null>(null)
  const completedRef = useRef(false)

  async function refreshSubmission(submissionId: string, aiFeedbackLoading = false) {
    const response = await fetch(`/api/submissions/${submissionId}`)
    if (!response.ok) return
    const submission = toMentorSubmission(await response.json())
    onSubmissionUpdate?.({ ...submission, aiFeedbackLoading })
  }

  async function handleSubmit() {
    if (submitting) return
    setSubmitting(true)
    setVerdict('pending')
    setStatus('Đang gửi...')
    setRuntimeMs(null)
    setMemoryKb(null)
    setTestProgress({ total: 0, completed: 0, passed: 0, failed: 0, known: false })
    completedRef.current = false

    const code = (window as any).__cpEditorValue ?? sessionStorage.getItem('cp-editor-code') ?? ''
    if (!code.trim()) {
      toast('Không có code để nộp', 'error')
      setSubmitting(false)
      setStatus('Sẵn sàng')
      return
    }

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId, code }),
      })
      if (!response.ok) throw new Error('Submit failed')
      const { submissionId } = await response.json()
      const optimisticSubmission: MentorSubmission = {
        id: submissionId,
        verdict: 'pending',
        runtimeMs: null,
        memoryKb: null,
        submittedAt: new Date().toISOString(),
        language: 'cpp17',
        aiFeedback: null,
        aiFeedbackLoading: false,
      }
      onSubmissionUpdate?.(optimisticSubmission)
      setStatus('Đang chấm...')
      openSSE(submissionId)
    } catch {
      toast('Nộp bài thất bại', 'error')
      setStatus('Lỗi')
      setSubmitting(false)
    }
  }

  function openSSE(submissionId: string) {
    if (esRef.current) esRef.current.close()
    const es = new EventSource(`/api/submissions/${submissionId}/stream`)
    esRef.current = es

    es.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data)
        if (typeof data.totalTests === 'number') {
          setTestProgress({
            total: data.totalTests,
            completed: data.completedTests ?? 0,
            passed: data.passedTests ?? 0,
            failed: data.failedTests ?? 0,
            known: true,
          })
          if (data.verdict === 'pending') setStatus('Đang chấm test...')
        }
        if (data.verdict) {
          setVerdict(data.verdict)
          setRuntimeMs(data.runtimeMs ?? null)
          setMemoryKb(data.memoryKb ?? null)
          if (data.verdict !== 'pending') {
            setStatus(data.verdict === 'AC' ? 'Accepted' : 'Có test chưa đúng')
            setSubmitting(false)
            completedRef.current = true
            await refreshSubmission(submissionId, false)
          }
        }
        if (data.aiFeedbackReady) {
          toast('AI Mentor có phản hồi mới!', 'success')
          await refreshSubmission(submissionId, false)
          setStatus('Mentor đã phân tích')
          es.close()
        }
      } catch {}
    }

    es.onerror = () => {
      es.close()
      setSubmitting(false)
      if (!completedRef.current) setStatus('Lỗi kết nối')
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const code = (window as any).__cpEditorValue
      if (code) sessionStorage.setItem('cp-editor-code', code)
    }, 500)
    return () => {
      clearInterval(interval)
      esRef.current?.close()
    }
  }, [])

  const isWrong = Boolean(verdict && verdict !== 'pending' && verdict !== 'AC')
  const progressPercent = testProgress.known && testProgress.total > 0
    ? Math.round((testProgress.completed / testProgress.total) * 100)
    : verdict && verdict !== 'pending'
      ? 100
      : 0
  const passPercent = testProgress.known && testProgress.total > 0
    ? (testProgress.passed / testProgress.total) * 100
    : verdict === 'AC'
      ? 100
      : 0
  const failPercent = testProgress.known && testProgress.total > 0
    ? (testProgress.failed / testProgress.total) * 100
    : isWrong
      ? 100
      : 0
  const progressLabel = testProgress.known && testProgress.total > 0
    ? `${testProgress.completed}/${testProgress.total} test`
    : submitting
      ? 'Đang chờ judge'
      : verdict
        ? `${progressPercent}%`
        : 'Chưa nộp'

  return (
    <div className="statusbar">
      <div className="status-main">
        <div className="status-topline">
          <div className="row">
            {verdict && <Badge verdict={verdict} />}
            {runtimeMs != null && <span className="muted mono">{runtimeMs}ms</span>}
            {memoryKb != null && <span className="muted mono">{Math.round(memoryKb / 1024)}MB</span>}
          </div>
          <span className="muted status-text">{status}</span>
        </div>
        <div className="status-progress-row">
          <div className={`judge-progress-track${submitting && !testProgress.known ? ' pending' : ''}`}>
            <span
              className="judge-progress-fill pass"
              style={{ width: `${Math.min(100, passPercent)}%` }}
            />
            <span
              className="judge-progress-fill fail"
              style={{
                left: `${Math.min(100, passPercent)}%`,
                width: `${Math.min(100 - Math.min(100, passPercent), failPercent)}%`,
              }}
            />
          </div>
          <span className="mono muted progress-label">{progressLabel}</span>
        </div>
      </div>
      <button
        className="primary-btn submit-btn"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? 'Đang chấm...' : 'Nộp bài'}
      </button>
    </div>
  )
}
