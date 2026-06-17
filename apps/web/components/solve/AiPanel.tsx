'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  problemSlug: string
  problemTitle: string
  submissionId?: string
  walkthroughLine?: { lineNumber: number; lineContent: string } | null
  aiFeedback?: string | null
  aiFeedbackLoading?: boolean
}

export default function AiPanel({
  problemSlug,
  problemTitle,
  submissionId,
  walkthroughLine,
  aiFeedback,
  aiFeedbackLoading,
}: Props) {
  const [tab, setTab] = useState<'feedback' | 'chat' | 'walkthrough'>('feedback')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [walkthroughContent, setWalkthroughContent] = useState('')
  const [walkthroughLoading, setWalkthroughLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchWalkthrough = useCallback(async (line: { lineNumber: number; lineContent: string }) => {
    setWalkthroughLoading(true)
    setWalkthroughContent('')
    try {
      const res = await fetch('/api/walkthrough', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemSlug,
          selectedLine: line.lineContent,
          lineNumber: line.lineNumber,
          fullCode: '',
        }),
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const l of lines) {
          if (l.startsWith('data: ')) text += l.slice(6)
        }
        setWalkthroughContent(text)
      }
    } finally {
      setWalkthroughLoading(false)
    }
  }, [problemSlug])

  useEffect(() => {
    if (walkthroughLine) {
      setTab('walkthrough')
      fetchWalkthrough(walkthroughLine)
    }
  }, [fetchWalkthrough, walkthroughLine])

  async function sendMessage() {
    if (!input.trim() || streaming) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)

    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages([...newMessages, assistantMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemSlug, submissionId, messages: newMessages }),
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const l of lines) {
          if (l.startsWith('data: ')) text += l.slice(6)
        }
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: text }
          return next
        })
      }
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="solve-col ai" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="col-head">
        <div className="tabs">
          <button className={tab === 'feedback' ? 'active' : ''} onClick={() => setTab('feedback')}>
            AI Feedback
          </button>
          <button className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>
            Chat
          </button>
          <button className={tab === 'walkthrough' ? 'active' : ''} onClick={() => setTab('walkthrough')}>
            Walkthrough
          </button>
        </div>
      </div>

      {tab === 'feedback' && (
        <div className="ai-panel" style={{ overflowY: 'auto', flex: 1 }}>
          {aiFeedbackLoading ? (
            <p className="muted">Đang chờ AI phân tích...</p>
          ) : aiFeedback ? (
            <ReactMarkdown>{aiFeedback}</ReactMarkdown>
          ) : (
            <p className="muted">Nộp bài để nhận phản hồi từ AI Mentor.</p>
          )}
        </div>
      )}

      {tab === 'chat' && (
        <>
          <div className="ai-panel" style={{ overflowY: 'auto', flex: 1 }}>
            {submissionId && (
              <div className="chip-row" style={{ marginBottom: 10 }}>
                <span className="pill">ngữ cảnh: {problemTitle}</span>
              </div>
            )}
            {messages.length === 0 && <p className="muted">Hỏi AI Mentor về bài toán này.</p>}
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.role}`}>
                {m.role === 'assistant' ? (
                  <ReactMarkdown>{m.content || '...'}</ReactMarkdown>
                ) : (
                  <span>{m.content}</span>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="ai-input">
            <textarea
              className="textarea"
              placeholder="Nhập câu hỏi... (Enter gửi, Shift+Enter xuống dòng)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
              }}
              style={{ flex: 1, border: 'none', background: 'transparent', resize: 'none', minHeight: 42, maxHeight: 100 }}
            />
            <button className="primary-btn" onClick={sendMessage} disabled={streaming}>
              {streaming ? '...' : 'Gửi'}
            </button>
          </div>
        </>
      )}

      {tab === 'walkthrough' && (
        <div className="ai-panel" style={{ overflowY: 'auto', flex: 1 }}>
          {walkthroughLoading ? (
            <p className="muted">AI đang giải thích...</p>
          ) : walkthroughContent ? (
            <>
              <ReactMarkdown>{walkthroughContent}</ReactMarkdown>
              <button
                className="secondary-btn"
                style={{ marginTop: 10 }}
                onClick={() => {
                  setTab('chat')
                  setInput(`Giải thích thêm về dòng ${walkthroughLine?.lineNumber}: ${walkthroughLine?.lineContent}`)
                }}
              >
                Hỏi thêm
              </button>
            </>
          ) : (
            <p className="muted">Click vào số dòng trong editor để AI giải thích dòng code đó.</p>
          )}
        </div>
      )}
    </div>
  )
}
