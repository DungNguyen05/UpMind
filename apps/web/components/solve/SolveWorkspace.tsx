'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import dynamic from 'next/dynamic'
import ProblemPanel from './ProblemPanel'
import StatusBar from './StatusBar'
import type { MentorSubmission } from './AiPanel'

interface Problem {
  id: string
  title: string
  slug: string
  difficulty: string
  timeLimitMs: number
  memoryLimitMb: number
  description: string
  topics: { name: string; slug: string }[]
  testCases: { input: string; expectedOutput: string }[]
}

interface UserSubmission {
  id: string
  verdict: string
  runtimeMs: number | null
  memoryKb: number | null
  submittedAt: string
  language: string
}

interface WalkthroughLine {
  lineNumber: number
  lineContent: string
  fullCode: string
}

interface Props {
  problem: Problem
  userSubmissions: UserSubmission[]
  initialLatestSubmission: MentorSubmission | null
}

const MIN_PROBLEM_WIDTH = 280
const MIN_CODE_WIDTH = 380
const MIN_AI_WIDTH = 340
const HANDLE_WIDTH = 1

function EditorPlaceholder() {
  return (
    <div className="solve-col editor-workspace editor-loading">
      <div className="editor-head">
        <div className="row">
          <span className="mono" style={{ fontSize: 13 }}>solution.cpp</span>
          <span className="pill">C++17</span>
        </div>
        <div className="row">
          <span className="skeleton" style={{ width: 38, height: 32 }} />
          <span className="skeleton" style={{ width: 96, height: 32 }} />
        </div>
      </div>
      <div className="editor-skeleton">
        {Array.from({ length: 12 }).map((_, index) => (
          <span key={index} style={{ width: `${index % 3 === 0 ? 72 : index % 3 === 1 ? 48 : 84}%` }} />
        ))}
      </div>
    </div>
  )
}

const Editor = dynamic(() => import('./Editor'), {
  ssr: false,
  loading: () => <EditorPlaceholder />,
})

const AiPanel = dynamic(() => import('./AiPanel'), {
  ssr: false,
  loading: () => (
    <div className="solve-col ai mentor-workspace open">
      <div className="mentor-head">
        <div>
          <span className="kicker">AI Mentor</span>
          <h2>Loading Mentor...</h2>
        </div>
      </div>
      <div className="ai-panel mentor-scroll">
        <div className="skeleton" style={{ height: 92, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 160 }} />
      </div>
    </div>
  ),
})

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export default function SolveWorkspace({ problem, userSubmissions, initialLatestSubmission }: Props) {
  const shellRef = useRef<HTMLDivElement>(null)
  const leftPaneRef = useRef<HTMLDivElement>(null)
  const aiPaneRef = useRef<HTMLDivElement>(null)
  const [submissions, setSubmissions] = useState(userSubmissions)
  const [latestSubmission, setLatestSubmission] = useState<MentorSubmission | null>(initialLatestSubmission)
  const [walkthroughLine, setWalkthroughLine] = useState<WalkthroughLine | null>(null)
  const [currentCode, setCurrentCode] = useState('')
  const [aiOpen, setAiOpen] = useState(false)
  const [editorBooted, setEditorBooted] = useState(false)
  const [paneWidths, setPaneWidths] = useState<{ problem?: number; ai?: number }>({})

  const handleCodeChange = useCallback((code: string) => {
    setCurrentCode(code)
  }, [])

  const handleWalkthroughLine = useCallback((lineNumber: number, lineContent: string, fullCode: string) => {
    setWalkthroughLine({ lineNumber, lineContent, fullCode })
    setAiOpen(true)
  }, [])

  const handleSubmissionUpdate = useCallback((submission: MentorSubmission) => {
    setLatestSubmission(submission)
    setSubmissions((prev) => {
      const nextRow: UserSubmission = {
        id: submission.id,
        verdict: submission.verdict,
        runtimeMs: submission.runtimeMs,
        memoryKb: submission.memoryKb,
        submittedAt: submission.submittedAt,
        language: submission.language,
      }
      const index = prev.findIndex((item) => item.id === submission.id)
      if (index === -1) return [nextRow, ...prev]
      const copy = [...prev]
      copy[index] = nextRow
      return copy
    })
  }, [])

  useEffect(() => {
    const bootEditor = () => setEditorBooted(true)
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
      cancelIdleCallback?: (id: number) => void
    }

    if (idleWindow.requestIdleCallback) {
      const id = idleWindow.requestIdleCallback(bootEditor, { timeout: 600 })
      return () => idleWindow.cancelIdleCallback?.(id)
    }

    const id = window.setTimeout(bootEditor, 120)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    const stored = window.localStorage.getItem('solvePaneWidths')
    if (!stored) return
    try {
      const parsed = JSON.parse(stored)
      if (typeof parsed.problem === 'number' || typeof parsed.ai === 'number') {
        setPaneWidths({
          problem: typeof parsed.problem === 'number' ? parsed.problem : undefined,
          ai: typeof parsed.ai === 'number' ? parsed.ai : undefined,
        })
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!paneWidths.problem && !paneWidths.ai) return
    window.localStorage.setItem('solvePaneWidths', JSON.stringify(paneWidths))
  }, [paneWidths])

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return

    const constrain = () => {
      if (window.matchMedia('(max-width: 1100px)').matches) return

      setPaneWidths((prev) => {
        const hasProblemWidth = typeof prev.problem === 'number'
        const hasAiWidth = typeof prev.ai === 'number'
        if (!hasProblemWidth && !hasAiWidth) return prev

        const handleCount = aiOpen ? 2 : 1
        const availableWidth = shell.getBoundingClientRect().width - HANDLE_WIDTH * handleCount
        const measuredProblemWidth = leftPaneRef.current?.getBoundingClientRect().width ?? MIN_PROBLEM_WIDTH
        const measuredAiWidth = aiPaneRef.current?.getBoundingClientRect().width ?? MIN_AI_WIDTH
        let nextProblem = hasProblemWidth ? prev.problem! : measuredProblemWidth
        let nextAi = hasAiWidth ? prev.ai! : measuredAiWidth

        if (!aiOpen) {
          const maxProblemWidth = Math.max(MIN_PROBLEM_WIDTH, availableWidth - MIN_CODE_WIDTH)
          const next = {
            ...prev,
            problem: hasProblemWidth ? Math.round(clamp(nextProblem, MIN_PROBLEM_WIDTH, maxProblemWidth)) : undefined,
          }
          if (next.problem === prev.problem) return prev
          return next
        }

        const maxSideWidth = Math.max(MIN_PROBLEM_WIDTH + MIN_AI_WIDTH, availableWidth - MIN_CODE_WIDTH)
        if (nextProblem + nextAi > maxSideWidth) {
          let excess = nextProblem + nextAi - maxSideWidth
          if (hasAiWidth) {
            const reducible = Math.max(0, nextAi - MIN_AI_WIDTH)
            const reduction = Math.min(reducible, excess)
            nextAi -= reduction
            excess -= reduction
          }
          if (hasProblemWidth && excess > 0) {
            const reducible = Math.max(0, nextProblem - MIN_PROBLEM_WIDTH)
            const reduction = Math.min(reducible, excess)
            nextProblem -= reduction
          }
        }

        const next = {
          problem: hasProblemWidth ? Math.round(clamp(nextProblem, MIN_PROBLEM_WIDTH, availableWidth - MIN_CODE_WIDTH - MIN_AI_WIDTH)) : undefined,
          ai: hasAiWidth ? Math.round(clamp(nextAi, MIN_AI_WIDTH, availableWidth - MIN_CODE_WIDTH - MIN_PROBLEM_WIDTH)) : undefined,
        }

        if (next.problem === prev.problem && next.ai === prev.ai) return prev
        return next
      })
    }

    const observer = new ResizeObserver(constrain)
    observer.observe(shell)
    window.addEventListener('resize', constrain)
    constrain()

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', constrain)
    }
  }, [aiOpen])

  const startResize = useCallback((target: 'problem' | 'ai') => (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (window.matchMedia('(max-width: 1100px)').matches) return
    event.preventDefault()

    const shell = shellRef.current
    if (!shell) return

    document.body.classList.add('resizing-panes')

    const handleMove = (moveEvent: globalThis.PointerEvent) => {
      const shellRect = shell.getBoundingClientRect()
      const currentProblemWidth = leftPaneRef.current?.getBoundingClientRect().width ?? paneWidths.problem ?? MIN_PROBLEM_WIDTH
      const currentAiWidth = aiOpen ? aiPaneRef.current?.getBoundingClientRect().width ?? paneWidths.ai ?? MIN_AI_WIDTH : 0
      const handleCount = aiOpen ? 2 : 1
      const availableWidth = shellRect.width - HANDLE_WIDTH * handleCount

      setPaneWidths((prev) => {
        if (target === 'problem') {
          const maxProblemWidth = Math.max(MIN_PROBLEM_WIDTH, availableWidth - currentAiWidth - MIN_CODE_WIDTH)
          return {
            ...prev,
            problem: Math.round(clamp(moveEvent.clientX - shellRect.left, MIN_PROBLEM_WIDTH, maxProblemWidth)),
          }
        }

        const maxAiWidth = Math.max(MIN_AI_WIDTH, availableWidth - currentProblemWidth - MIN_CODE_WIDTH)
        return {
          ...prev,
          ai: Math.round(clamp(shellRect.right - moveEvent.clientX, MIN_AI_WIDTH, maxAiWidth)),
        }
      })
    }

    const stopResize = () => {
      document.body.classList.remove('resizing-panes')
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', stopResize)
      window.removeEventListener('pointercancel', stopResize)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', stopResize)
    window.addEventListener('pointercancel', stopResize)
  }, [aiOpen, paneWidths.ai, paneWidths.problem])

  const resetPaneWidths = useCallback(() => {
    window.localStorage.removeItem('solvePaneWidths')
    setPaneWidths({})
  }, [])

  return (
    <>
      <div
        ref={shellRef}
        className={`solve-shell resizable-solve-shell ${aiOpen ? 'ai-open' : 'ai-hidden'}`}
        style={{
          '--problem-pane': paneWidths.problem ? `${paneWidths.problem}px` : undefined,
          '--ai-pane': paneWidths.ai ? `${paneWidths.ai}px` : undefined,
        } as CSSProperties}
      >
        <div ref={leftPaneRef} className="solve-pane-wrap problem-pane-wrap">
          <ProblemPanel problem={problem} userSubmissions={submissions} />
        </div>
        <button
          className="pane-resizer"
          type="button"
          aria-label="Kéo để đổi độ rộng đề bài và editor"
          title="Kéo để đổi độ rộng. Double click để reset."
          onPointerDown={startResize('problem')}
          onDoubleClick={resetPaneWidths}
        />
        {editorBooted ? (
          <Editor
            problemId={problem.id}
            problemSlug={problem.slug}
            aiOpen={aiOpen}
            onToggleAi={() => setAiOpen((open) => !open)}
            onCodeChange={handleCodeChange}
            onWalkthroughLine={handleWalkthroughLine}
          />
        ) : (
          <EditorPlaceholder />
        )}
        {aiOpen && (
          <>
            <button
              className="pane-resizer"
              type="button"
              aria-label="Kéo để đổi độ rộng editor và AI"
              title="Kéo để đổi độ rộng. Double click để reset."
              onPointerDown={startResize('ai')}
              onDoubleClick={resetPaneWidths}
            />
            <div ref={aiPaneRef} className="solve-pane-wrap ai-pane-wrap">
              <AiPanel
                problemSlug={problem.slug}
                problemTitle={problem.title}
                latestSubmission={latestSubmission}
                walkthroughLine={walkthroughLine}
                currentCode={currentCode}
                mobileOpen={aiOpen}
                onClose={() => setAiOpen(false)}
              />
            </div>
          </>
        )}
      </div>
      <StatusBar problemId={problem.id} onSubmissionUpdate={handleSubmissionUpdate} />
    </>
  )
}
