'use client'

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import MonacoEditor, { OnMount } from '@monaco-editor/react'
import { formatCppCode } from '@/lib/formatCpp'

const CPP_TEMPLATE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // TODO: giải bài ở đây

    return 0;
}
`

function prefillKey(problemSlug: string) {
  return `prefillCode:${problemSlug}`
}

function draftKey(problemSlug: string) {
  return `draftCode:${problemSlug}`
}

function readStoredCode(problemSlug: string) {
  if (typeof window === 'undefined') return CPP_TEMPLATE
  const legacyCode = sessionStorage.getItem('cp-editor-code')
  const legacySlug = sessionStorage.getItem('cp-editor-code-slug')
  return (
    localStorage.getItem(prefillKey(problemSlug)) ??
    localStorage.getItem(draftKey(problemSlug)) ??
    sessionStorage.getItem(draftKey(problemSlug)) ??
    (legacySlug === problemSlug ? legacyCode : null) ??
    CPP_TEMPLATE
  )
}

function writeStorage(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value)
  } catch {}
}

interface Props {
  problemId: string
  problemSlug: string
  aiOpen?: boolean
  onToggleAi?: () => void
  onCodeChange?: (code: string) => void
}

export interface EditorRef {
  getValue: () => string
}

const Editor = forwardRef<EditorRef, Props>(function Editor(
  { problemSlug, aiOpen, onToggleAi, onCodeChange },
  ref
) {
  const editorRef = useRef<any>(null)
  const [code, setCode] = useState(() => readStoredCode(problemSlug))
  const latestCodeRef = useRef(code)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useImperativeHandle(ref, () => ({
    getValue: () => editorRef.current?.getValue() ?? code,
  }))

  useEffect(() => {
    if (typeof window === 'undefined') return

    const nextCode = readStoredCode(problemSlug)
    setCode(nextCode)
    editorRef.current?.setValue(nextCode)
    syncCode(nextCode, true)
    localStorage.removeItem(prefillKey(problemSlug))
    // Run only when the route changes problem; regular edits are persisted in syncCode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemSlug])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      persistCode(latestCodeRef.current)
    }
    // Persist any pending draft before leaving the problem/editor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemSlug])

  function persistCode(nextCode: string) {
    ;(window as any).__cpEditorValue = nextCode
    writeStorage(localStorage, draftKey(problemSlug), nextCode)
    writeStorage(sessionStorage, draftKey(problemSlug), nextCode)
    writeStorage(sessionStorage, 'cp-editor-code', nextCode)
    writeStorage(sessionStorage, 'cp-editor-code-slug', problemSlug)
  }

  function syncCode(nextCode: string, flush = false) {
    latestCodeRef.current = nextCode
    ;(window as any).__cpEditorValue = nextCode
    onCodeChange?.(nextCode)

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    if (flush) {
      persistCode(nextCode)
      return
    }

    saveTimerRef.current = setTimeout(() => {
      persistCode(latestCodeRef.current)
      saveTimerRef.current = null
    }, 350)
  }

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    syncCode(editor.getValue(), true)

    monaco.editor.defineTheme('cp-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: { 'editor.background': '#0b0f17' },
    })
    monaco.editor.setTheme('cp-dark')
    editor.updateOptions({ fontFamily: "'JetBrains Mono', monospace", fontSize: 14 })

  }

  function handleReset() {
    if (confirm('Reset code về template ban đầu?')) {
      setCode(CPP_TEMPLATE)
      editorRef.current?.setValue(CPP_TEMPLATE)
      syncCode(CPP_TEMPLATE, true)
    }
  }

  function handleFormat() {
    const editor = editorRef.current
    const model = editor?.getModel()
    if (!editor || !model) return

    const formattedCode = formatCppCode(model.getValue(), model.getOptions().tabSize)
    if (formattedCode === model.getValue()) return

    editor.pushUndoStop()
    editor.executeEdits('format-cpp', [
      {
        range: model.getFullModelRange(),
        text: formattedCode,
        forceMoveMarkers: true,
      },
    ])
    editor.pushUndoStop()
    setCode(formattedCode)
    syncCode(formattedCode, true)
  }

  return (
    <div className="solve-col editor-workspace" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="editor-head">
        <div className="row">
          <span className="mono" style={{ fontSize: 13 }}>solution.cpp</span>
          <span className="pill">C++17</span>
        </div>
        <div className="row">
          <button type="button" className="ghost-btn icon-btn" title="Format code" onClick={handleFormat}>{'{ }'}</button>
          <button className="ghost-btn icon-btn" title="Reset code" onClick={handleReset}>↻</button>
          <button
            className={`secondary-btn mentor-toggle${aiOpen ? ' active' : ''}`}
            type="button"
            onClick={onToggleAi}
          >
            {aiOpen ? 'Ẩn Mentor' : 'AI Mentor'}
          </button>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <MonacoEditor
          height="100%"
          language="cpp"
          value={code}
          onChange={(value) => {
            const nextCode = value ?? ''
            setCode(nextCode)
            syncCode(nextCode)
          }}
          onMount={handleMount}
          options={{
            minimap: { enabled: false },
            overviewRulerLanes: 0,
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            glyphMargin: false,
            wordWrap: 'off',
            tabSize: 4,
          }}
        />
      </div>
    </div>
  )
})

export default Editor
