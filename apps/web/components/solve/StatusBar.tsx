'use client'

import { useState, useEffect, useRef } from 'react'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'

interface Props {
  problemId: string
}

export default function StatusBar({ problemId }: Props) {
  const toast = useToast()
  const [verdict, setVerdict] = useState<string | null>(null)
  const [runtimeMs, setRuntimeMs] = useState<number | null>(null)
  const [memoryKb, setMemoryKb] = useState<number | null>(null)
  const [status, setStatus] = useState('Sẵn sàng')
  const [submitting, setSubmitting] = useState(false)
  const [aiFeedback, setAiFeedback] = useState<string | null>(null)
  const esRef = useRef<EventSource | null>(null)

  async function handleSubmit() {
    if (submitting) return
    setSubmitting(true)
    setVerdict('pending')
    setStatus('Đang gửi...')

    const code = (window as any).__cpEditorValue ?? sessionStorage.getItem('cp-editor-code') ?? ''
    if (!code.trim()) {
      toast('Không có code để nộp', 'error')
      setSubmitting(false)
      setStatus('Sẵn sàng')
      return
    }

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId, code }),
      })
      if (!res.ok) throw new Error('Submit failed')
      const { submissionId } = await res.json()
      setStatus('Đang chấm...')
      openSSE(submissionId)
    } catch {
      toast('Nộp bài thất bại', 'error')
      setStatus('Lỗi')
      setSubmitting(false)
    }
  }

  function openSSE(submissionId: string) {
    if (esRef.current) { esRef.current.close() }
    const es = new EventSource(`/api/submissions/${submissionId}/stream`)
    esRef.current = es
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.verdict) {
          setVerdict(data.verdict)
          setRuntimeMs(data.runtimeMs ?? null)
          setMemoryKb(data.memoryKb ?? null)
          if (data.verdict !== 'pending') {
            setStatus('Hoàn thành')
            setSubmitting(false)
            es.close()
          }
        }
        if (data.aiFeedbackReady) {
          toast('AI Mentor có phản hồi mới!', 'success')
          fetch(`/api/submissions/${submissionId}`).then((r) => r.json()).then((sub) => {
            if (sub.aiFeedback?.content) setAiFeedback(sub.aiFeedback.content)
          })
        }
      } catch {}
    }
    es.onerror = () => { es.close(); setSubmitting(false); setStatus('Lỗi kết nối') }
  }

  // Sync editor code to sessionStorage periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const editors = document.querySelectorAll('.monaco-editor')
      if (editors.length > 0) {
        // Monaco stores value in model; read via window.__editorRef if set
        const code = (window as any).__cpEditorValue
        if (code) sessionStorage.setItem('cp-editor-code', code)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="statusbar">
      <div className="row">
        {verdict && <Badge verdict={verdict} />}
        {runtimeMs != null && <span className="muted mono">{runtimeMs}ms</span>}
        {memoryKb != null && <span className="muted mono">{Math.round(memoryKb / 1024)}MB</span>}
      </div>
      <span className="muted" style={{ fontSize: 13 }}>{status}</span>
      <button
        className="primary-btn"
        onClick={handleSubmit}
        disabled={submitting}
        style={{ minWidth: 90 }}
      >
        {submitting ? 'Đang chấm...' : 'Nộp bài'}
      </button>
    </div>
  )
}
