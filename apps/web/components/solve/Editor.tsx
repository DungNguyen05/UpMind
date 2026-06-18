'use client'

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import MonacoEditor, { OnMount } from '@monaco-editor/react'

const CPP_TEMPLATE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // TODO: giải bài ở đây

    return 0;
}
`

interface Props {
  problemId: string
  problemSlug: string
  aiOpen?: boolean
  onToggleAi?: () => void
  onWalkthroughLine?: (lineNumber: number, lineContent: string, fullCode: string) => void
  onCodeChange?: (code: string) => void
}

export interface EditorRef {
  getValue: () => string
}

const Editor = forwardRef<EditorRef, Props>(function Editor(
  { problemSlug, aiOpen, onToggleAi, onWalkthroughLine, onCodeChange },
  ref
) {
  const editorRef = useRef<any>(null)
  const [code, setCode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`prefillCode:${problemSlug}`) ?? CPP_TEMPLATE
    }
    return CPP_TEMPLATE
  })

  useImperativeHandle(ref, () => ({
    getValue: () => editorRef.current?.getValue() ?? code,
  }))

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefill = localStorage.getItem(`prefillCode:${problemSlug}`)
      if (prefill) {
        setCode(prefill)
        onCodeChange?.(prefill)
        localStorage.removeItem(`prefillCode:${problemSlug}`)
      } else {
        onCodeChange?.(code)
      }
    }
  }, [code, onCodeChange, problemSlug])

  function syncCode(nextCode: string) {
    ;(window as any).__cpEditorValue = nextCode
    sessionStorage.setItem('cp-editor-code', nextCode)
    onCodeChange?.(nextCode)
  }

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    syncCode(editor.getValue())

    editor.onDidChangeModelContent(() => {
      syncCode(editor.getValue())
    })

    monaco.editor.defineTheme('cp-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: { 'editor.background': '#0b0f17' },
    })
    monaco.editor.setTheme('cp-dark')
    editor.updateOptions({ fontFamily: "'JetBrains Mono', monospace", fontSize: 14 })

    editor.onMouseDown((e) => {
      if (e.target.type === 2 /* GUTTER_GLYPH_MARGIN */ || e.target.type === 3 /* GUTTER_LINE_NUMBERS */) {
        const lineNumber = e.target.position?.lineNumber
        if (lineNumber && onWalkthroughLine) {
          const lineContent = editor.getModel()?.getLineContent(lineNumber) ?? ''
          onWalkthroughLine(lineNumber, lineContent, editor.getValue())
        }
      }
    })
  }

  function handleReset() {
    if (confirm('Reset code về template ban đầu?')) {
      setCode(CPP_TEMPLATE)
      editorRef.current?.setValue(CPP_TEMPLATE)
      syncCode(CPP_TEMPLATE)
    }
  }

  function handleFormat() {
    editorRef.current?.getAction('editor.action.formatDocument')?.run()
  }

  return (
    <div className="solve-col editor-workspace" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="editor-head">
        <div className="row">
          <span className="mono" style={{ fontSize: 13 }}>solution.cpp</span>
          <span className="pill">C++17</span>
        </div>
        <div className="row">
          <button className="ghost-btn icon-btn" title="Format code" onClick={handleFormat}>{'{ }'}</button>
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
            glyphMargin: true,
            wordWrap: 'off',
            tabSize: 4,
          }}
        />
      </div>
    </div>
  )
})

export default Editor
