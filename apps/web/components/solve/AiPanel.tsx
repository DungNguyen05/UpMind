'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { useToast } from '@/components/ui/Toast'
import Badge from '@/components/ui/Badge'
import { getMentorNextStep, getPatchSuggestion, getRootCause } from '@/lib/mentor'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

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

interface WalkthroughLine {
  lineNumber: number
  lineContent: string
  fullCode: string
}

interface Props {
  problemSlug: string
  problemTitle: string
  latestSubmission?: MentorSubmission | null
  walkthroughLine?: WalkthroughLine | null
  currentCode?: string
  mobileOpen?: boolean
}

type Tab = 'plan' | 'debug' | 'chat' | 'walkthrough'

const QUICK_PROMPTS = [
  'Gợi ý hướng giải nhưng đừng đưa code hoàn chỉnh.',
  'Tạo thêm 3 test biên cho bài này.',
  'Giải thích vì sao thuật toán đúng bằng invariant.',
  'Debug submission gần nhất và chỉ ra bước sửa tiếp theo.',
]

function planSteps(problemTitle: string, verdict?: string) {
  const solved = verdict === 'AC'
  return [
    { label: `Tóm tắt lại input, output và mục tiêu của bài "${problemTitle}".`, done: true },
    { label: 'Chọn trạng thái/biến chính cần theo dõi trong lúc giải.', done: solved },
    { label: 'Chứng minh mỗi bước chuyển không làm mất đáp án hợp lệ.', done: solved },
    { label: 'Tạo test biên nhỏ trước khi nộp lại.', done: false },
  ]
}

function hints(problemTitle: string, verdict?: string) {
  if (verdict === 'WA') {
    return [
      'Chạy tay trên test nhỏ nhất có thể. Ghi lại biến chính sau mỗi bước, rồi so với output mong đợi.',
      'Tìm nhánh điều kiện đầu tiên làm invariant bị phá vỡ. Sửa nhánh đó trước khi đổi thuật toán.',
      'Nếu test bị hidden, tự tạo test biên: kích thước nhỏ, giá trị trùng nhau, cực trị và đáp án ở rìa.',
    ]
  }
  if (verdict === 'TLE') {
    return [
      'Ước lượng số phép tính tệ nhất từ constraints, rồi so với time limit.',
      'Khoanh vùng vòng lặp lồng nhau hoặc thao tác container đang chạy nhiều nhất.',
      'Tìm cách lưu lại kết quả trung gian, dùng binary search, prefix/suffix hoặc cấu trúc dữ liệu phù hợp.',
    ]
  }
  return [
    `Viết một câu mô tả trạng thái cần biết để giải "${problemTitle}".`,
    'Thử brute force trên input nhỏ để nhìn pattern trước khi tối ưu.',
    'Sau khi có ý tưởng, tự hỏi: bước chuyển nào đảm bảo không bỏ sót đáp án?',
  ]
}

function formatMemory(memoryKb: number | null) {
  return memoryKb != null ? `${Math.round(memoryKb / 1024)}MB` : '—'
}

export default function AiPanel({
  problemSlug,
  problemTitle,
  latestSubmission,
  walkthroughLine,
  currentCode,
  mobileOpen,
}: Props) {
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('plan')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [walkthroughContent, setWalkthroughContent] = useState('')
  const [walkthroughLoading, setWalkthroughLoading] = useState(false)
  const [revealedHint, setRevealedHint] = useState(0)
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchWalkthrough = useCallback(async (line: WalkthroughLine) => {
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
          fullCode: line.fullCode || currentCode || '',
        }),
      })
      if (!res.ok) throw new Error('Walkthrough failed')
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const lineText of lines) {
          if (lineText.startsWith('data: ')) text += lineText.slice(6)
        }
        setWalkthroughContent(text)
      }
    } catch {
      setWalkthroughContent('Mentor chưa thể phân tích dòng này. Hãy thử lại sau hoặc hỏi trực tiếp trong tab Chat.')
    } finally {
      setWalkthroughLoading(false)
    }
  }, [currentCode, problemSlug])

  useEffect(() => {
    if (walkthroughLine) {
      setTab('walkthrough')
      fetchWalkthrough(walkthroughLine)
    }
  }, [fetchWalkthrough, walkthroughLine])

  function focusChat(prompt: string) {
    setTab('chat')
    setInput(prompt)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  async function sendMessage() {
    if (!input.trim() || streaming) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages([...newMessages, { role: 'assistant', content: '' }])
    setInput('')
    setStreaming(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemSlug,
          submissionId: latestSubmission?.id,
          contextCode: currentCode,
          messages: newMessages,
        }),
      })
      if (!res.ok) throw new Error('Chat failed')
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const lineText of lines) {
          if (lineText.startsWith('data: ')) text += lineText.slice(6)
        }
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: text }
          return next
        })
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: 'Mentor chưa trả lời được lúc này. Kiểm tra đăng nhập hoặc cấu hình AI rồi thử lại.' }
        return next
      })
    } finally {
      setStreaming(false)
    }
  }

  const steps = planSteps(problemTitle, latestSubmission?.verdict)
  const hintItems = hints(problemTitle, latestSubmission?.verdict)
  const nextStep = latestSubmission ? getMentorNextStep(latestSubmission) : 'Đọc đề, viết ý tưởng ngắn và thử test mẫu trước khi nộp.'

  return (
    <div className={`solve-col ai mentor-workspace ${mobileOpen ? 'open' : ''}`}>
      <div className="mentor-head">
        <div>
          <span className="kicker">AI Mentor active</span>
          <h2>Workspace Mentor</h2>
          <p className="muted">Theo dõi đề, code hiện tại và submission gần nhất để gợi ý đúng thời điểm.</p>
        </div>
        <span className="badge pending">Context live</span>
      </div>

      <div className="mentor-context">
        <div>
          <span>Mục tiêu</span>
          <strong>{problemTitle}</strong>
        </div>
        <div>
          <span>Submission</span>
          <strong>{latestSubmission ? latestSubmission.verdict : 'Chưa nộp'}</strong>
        </div>
        <div>
          <span>Bước tiếp</span>
          <strong>{nextStep}</strong>
        </div>
      </div>

      <div className="col-head mentor-tabs">
        <div className="tabs">
          <button className={tab === 'plan' ? 'active' : ''} onClick={() => setTab('plan')}>Kế hoạch</button>
          <button className={tab === 'debug' ? 'active' : ''} onClick={() => setTab('debug')}>Debug</button>
          <button className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>Hỏi AI</button>
          <button className={tab === 'walkthrough' ? 'active' : ''} onClick={() => setTab('walkthrough')}>Dòng code</button>
        </div>
      </div>

      {tab === 'plan' && (
        <div className="ai-panel mentor-scroll">
          <section className="mentor-section">
            <h3>Kế hoạch giải</h3>
            <div className="mentor-steps">
              {steps.map((step, index) => {
                const checked = checkedSteps[index] ?? step.done
                return (
                  <label key={step.label} className={`mentor-step ${checked ? 'done' : index === 2 ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => setCheckedSteps((prev) => ({ ...prev, [index]: event.target.checked }))}
                    />
                    <span>{step.label}</span>
                  </label>
                )
              })}
            </div>
          </section>

          <section className="mentor-section">
            <h3>Hint ladder</h3>
            <div className="hint-list">
              {hintItems.map((hint, index) => (
                <button
                  key={hint}
                  className="hint-card"
                  type="button"
                  onClick={() => setRevealedHint(index + 1)}
                >
                  <Badge verdict={index === 0 ? 'easy' : index === 1 ? 'medium' : 'hard'} />
                  <span>Hint {index + 1}</span>
                </button>
              ))}
            </div>
            <div className="mentor-answer">
              {revealedHint > 0 ? hintItems[revealedHint - 1] : 'Chọn một hint để Mentor mở gợi ý từng bước.'}
            </div>
          </section>

          <section className="mentor-section">
            <h3>Test nên thử</h3>
            <div className="test-pack">
              <pre>{latestSubmission?.failedTestInput && latestSubmission.failedTestInput !== '(hidden)' ? latestSubmission.failedTestInput : 'Tự tạo input nhỏ nhất chạm edge case bạn đang nghi ngờ.'}</pre>
              {latestSubmission?.failedTestInput && latestSubmission.failedTestInput !== '(hidden)' && (
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(latestSubmission.failedTestInput ?? '')
                    toast('Đã copy test Mentor đề xuất.', 'success')
                  }}
                >
                  Copy test
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      {tab === 'debug' && (
        <div className="ai-panel mentor-scroll">
          {!latestSubmission ? (
            <p className="muted">Nộp bài để Mentor có verdict, runtime và test sai làm ngữ cảnh debug.</p>
          ) : (
            <>
              <div className="feedback-score">
                <div>
                  <Badge verdict={latestSubmission.verdict} />
                  <strong>{getRootCause(latestSubmission)}</strong>
                </div>
                <span className="mono muted">
                  {latestSubmission.runtimeMs != null ? `${latestSubmission.runtimeMs}ms` : '—'} · {formatMemory(latestSubmission.memoryKb)}
                </span>
              </div>

              <section className="mentor-section">
                <h3>Patch đề xuất</h3>
                <div className="mentor-answer">{getPatchSuggestion(latestSubmission)}</div>
              </section>

              {(latestSubmission.compileError || latestSubmission.failedTestInput) && (
                <section className="mentor-section">
                  <h3>Bằng chứng từ judge</h3>
                  {latestSubmission.compileError && <pre className="code-block">{latestSubmission.compileError}</pre>}
                  {latestSubmission.failedTestInput && (
                    <div className="test-pack">
                      <pre>{latestSubmission.failedTestInput}</pre>
                      {latestSubmission.failedTestInput !== '(hidden)' && (
                        <button
                          className="secondary-btn"
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(latestSubmission.failedTestInput ?? '')
                            toast('Đã copy input lỗi.', 'success')
                          }}
                        >
                          Copy test
                        </button>
                      )}
                    </div>
                  )}
                  {latestSubmission.failedTestOutput && (
                    <div>
                      <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Output của code</div>
                      <pre className="code-block">{latestSubmission.failedTestOutput}</pre>
                    </div>
                  )}
                </section>
              )}

              <section className="mentor-section">
                <h3>AI feedback</h3>
                {latestSubmission.aiFeedbackLoading ? (
                  <p className="muted">Đang chờ Mentor phân tích submission mới...</p>
                ) : latestSubmission.aiFeedback?.content ? (
                  <ReactMarkdown>{latestSubmission.aiFeedback.content}</ReactMarkdown>
                ) : (
                  <p className="muted">Chưa có feedback từ LLM. Mentor vẫn có thể chat dựa trên verdict và code hiện tại.</p>
                )}
              </section>

              <button
                className="secondary-btn full"
                type="button"
                onClick={() => focusChat('Giải thích kỹ hơn root cause của submission gần nhất và cho em thứ tự sửa.')}
              >
                Hỏi AI giải thích lỗi này
              </button>
            </>
          )}
        </div>
      )}

      {tab === 'chat' && (
        <>
          <div className="ai-panel mentor-scroll">
            <div className="context-strip">
              <span className="pill active">Đề: {problemTitle}</span>
              <span className="pill active">Code hiện tại</span>
              {latestSubmission && <span className="pill active">Submission {latestSubmission.verdict}</span>}
            </div>
            <div className="quick-prompts">
              {QUICK_PROMPTS.map((prompt) => (
                <button key={prompt} type="button" onClick={() => focusChat(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>

            {messages.length === 0 && (
              <div className="message ai">
                <strong>Mentor:</strong> Hỏi mình về ý tưởng, test biên, lỗi dòng code hoặc submission gần nhất.
              </div>
            )}
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.role === 'assistant' ? 'ai' : 'user'}`}>
                {message.role === 'assistant' ? (
                  <ReactMarkdown>{message.content || '...'}</ReactMarkdown>
                ) : (
                  <span>{message.content}</span>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="ai-input">
            <textarea
              ref={inputRef}
              className="textarea"
              placeholder="Hỏi Mentor về ý tưởng, test biên, lỗi dòng code..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  sendMessage()
                }
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
        <div className="ai-panel mentor-scroll">
          {walkthroughLine && (
            <div className="line-callout">
              <span className="mono">{walkthroughLine.lineNumber}</span>
              <code>{walkthroughLine.lineContent || '(dòng trống)'}</code>
            </div>
          )}
          {walkthroughLoading ? (
            <p className="muted">AI đang giải thích dòng code...</p>
          ) : walkthroughContent ? (
            <>
              <ReactMarkdown>{walkthroughContent}</ReactMarkdown>
              <button
                className="secondary-btn"
                style={{ marginTop: 10 }}
                onClick={() => focusChat(`Giải thích thêm về dòng ${walkthroughLine?.lineNumber}: ${walkthroughLine?.lineContent}`)}
              >
                Hỏi thêm trong chat
              </button>
            </>
          ) : (
            <p className="muted">Click vào gutter hoặc số dòng trong editor để Mentor giải thích dòng code, biến liên quan và rủi ro logic.</p>
          )}
        </div>
      )}
    </div>
  )
}
