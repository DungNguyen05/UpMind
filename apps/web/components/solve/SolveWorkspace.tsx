'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import ProblemPanel from './ProblemPanel'
import Editor from './Editor'
import AiPanel, { type MentorSubmission } from './AiPanel'
import StatusBar from './StatusBar'

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
const HANDLE_WIDTH = 10

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

        const availableWidth = shell.getBoundingClientRect().width - HANDLE_WIDTH * 2
        const measuredProblemWidth = leftPaneRef.current?.getBoundingClientRect().width ?? MIN_PROBLEM_WIDTH
        const measuredAiWidth = aiPaneRef.current?.getBoundingClientRect().width ?? MIN_AI_WIDTH
        let nextProblem = hasProblemWidth ? prev.problem! : measuredProblemWidth
        let nextAi = hasAiWidth ? prev.ai! : measuredAiWidth

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
  }, [])

  const startResize = useCallback((target: 'problem' | 'ai') => (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (window.matchMedia('(max-width: 1100px)').matches) return
    event.preventDefault()

    const shell = shellRef.current
    if (!shell) return

    document.body.classList.add('resizing-panes')

    const handleMove = (moveEvent: globalThis.PointerEvent) => {
      const shellRect = shell.getBoundingClientRect()
      const currentProblemWidth = leftPaneRef.current?.getBoundingClientRect().width ?? paneWidths.problem ?? MIN_PROBLEM_WIDTH
      const currentAiWidth = aiPaneRef.current?.getBoundingClientRect().width ?? paneWidths.ai ?? MIN_AI_WIDTH
      const availableWidth = shellRect.width - HANDLE_WIDTH * 2

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
  }, [paneWidths.ai, paneWidths.problem])

  const resetPaneWidths = useCallback(() => {
    window.localStorage.removeItem('solvePaneWidths')
    setPaneWidths({})
  }, [])

  return (
    <>
      <div
        ref={shellRef}
        className="solve-shell resizable-solve-shell"
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
        <Editor
          problemId={problem.id}
          problemSlug={problem.slug}
          onCodeChange={handleCodeChange}
          onWalkthroughLine={handleWalkthroughLine}
        />
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
          />
        </div>
      </div>
      <button className="primary-btn ai-drawer-toggle" type="button" onClick={() => setAiOpen((open) => !open)}>
        AI
      </button>
      <StatusBar problemId={problem.id} onSubmissionUpdate={handleSubmissionUpdate} />
    </>
  )
}
