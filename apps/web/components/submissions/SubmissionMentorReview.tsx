'use client'

import { useRef, useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { getMentorNextStep, getPatchSuggestion, getReviewFocus, getRootCause } from '@/lib/mentor'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

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

interface Props {
  submission: Submission
}

const PROMPTS = [
  { label: 'Trace test lỗi', prompt: 'Trace từng bước trên test lỗi và chỉ ra biến nào bắt đầu sai.' },
  { label: 'Patch nhỏ nhất', prompt: 'Gợi ý patch nhỏ nhất để sửa submission này, đừng đưa full code.' },
  { label: 'Test tương tự', prompt: 'Tạo thêm 3 test nhỏ cùng kiểu lỗi để em tự kiểm tra.' },
]

function memoryText(memoryKb: number | null) {
  return memoryKb != null ? `${Math.round(memoryKb / 1024)}MB` : '—'
}

export default function SubmissionMentorReview({ submission }: Props) {
  const toast = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function applyPrompt(prompt: string) {
    setInput(prompt)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  async function sendMessage() {
    if (!input.trim() || streaming) return
    const userMessage: Message = { role: 'user', content: input.trim() }
    const nextMessages = [...messages, userMessage]
    setMessages([...nextMessages, { role: 'assistant', content: '' }])
    setInput('')
    setStreaming(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemSlug: submission.problem.slug,
          submissionId: submission.id,
          messages: nextMessages,
        }),
      })
      if (!response.ok) throw new Error('Chat failed')
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) text += line.slice(6)
        }
        setMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: text }
          return copy
        })
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev]
        copy[copy.length - 1] = { role: 'assistant', content: 'Mentor chưa phản hồi được lúc này. Kiểm tra đăng nhập hoặc cấu hình AI rồi thử lại.' }
        return copy
      })
    } finally {
      setStreaming(false)
    }
  }

  const canCopyTest = Boolean(submission.failedTestInput && submission.failedTestInput !== '(hidden)')

  return (
    <aside className="panel mentor-review">
      <div className="panel-head">
        <div>
          <span className="kicker">AI Mentor Review</span>
          <h2>{getReviewFocus(submission.verdict)}</h2>
        </div>
        <Badge verdict={submission.verdict} />
      </div>

      <div className="review-hero">
        <span className="badge pending">Mentor next step</span>
        <strong>{getMentorNextStep(submission)}</strong>
        <p className="muted">Review này nối verdict, code đã nộp, test lỗi và feedback AI để ưu tiên bước sửa tiếp theo.</p>
      </div>

      <div className="review-grid">
        <div className="review-card">
          <span className="kicker">Root cause</span>
          <p>{getRootCause(submission)}</p>
        </div>
        <div className="review-card">
          <span className="kicker">Runtime / Memory</span>
          <p className="mono">{submission.runtimeMs != null ? `${submission.runtimeMs}ms` : '—'} · {memoryText(submission.memoryKb)}</p>
        </div>
      </div>

      <section className="mentor-section">
        <h3>Patch Mentor đề xuất</h3>
        <div className="mentor-answer">
          {submission.aiFeedback?.content ? (
            <ReactMarkdown>{submission.aiFeedback.content}</ReactMarkdown>
          ) : (
            getPatchSuggestion(submission)
          )}
        </div>
      </section>

      <section className="mentor-section">
        <h3>Test tái hiện lỗi</h3>
        {submission.compileError ? (
          <pre className="code-block">{submission.compileError}</pre>
        ) : submission.failedTestInput ? (
          <div className="test-pack">
            <pre>{submission.failedTestInput}</pre>
            {canCopyTest && (
              <button
                className="secondary-btn"
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(submission.failedTestInput ?? '')
                  toast('Đã copy test tái hiện lỗi.', 'success')
                }}
              >
                Copy test
              </button>
            )}
          </div>
        ) : (
          <p className="muted">Submission này chưa có test lỗi công khai. Hỏi Mentor để tạo test biên tương tự.</p>
        )}
        {submission.failedTestOutput && (
          <div style={{ marginTop: 10 }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Output của code</div>
            <pre className="code-block">{submission.failedTestOutput}</pre>
          </div>
        )}
      </section>

      <section className="mentor-section">
        <h3>Chat follow-up</h3>
        <div className="quick-prompts review-prompts">
          {PROMPTS.map((item) => (
            <button key={item.label} type="button" onClick={() => applyPrompt(item.prompt)}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="message-list">
          {messages.length === 0 && (
            <div className="message ai">
              <strong>Mentor:</strong> Lần nộp này đang được gắn với code, verdict và test lỗi. Hỏi tiếp để debug sâu hơn.
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role === 'assistant' ? 'ai' : 'user'}`}>
              {message.role === 'assistant' ? <ReactMarkdown>{message.content || '...'}</ReactMarkdown> : message.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input">
          <textarea
            ref={inputRef}
            className="textarea"
            placeholder="Hỏi thêm Mentor về submission này..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                sendMessage()
              }
            }}
          />
          <button className="primary-btn" type="button" onClick={sendMessage} disabled={streaming}>
            {streaming ? '...' : 'Gửi'}
          </button>
        </div>
      </section>
    </aside>
  )
}
