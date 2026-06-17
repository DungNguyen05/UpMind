'use client'

import { useState } from 'react'

interface TestCase {
  input: string
  expectedOutput: string
  isSample: boolean
}

interface Props {
  value: TestCase[]
  onChange: (cases: TestCase[]) => void
}

export default function TestCaseEditor({ value, onChange }: Props) {
  const [tab, setTab] = useState<'manual' | 'zip'>('manual')

  function add() {
    onChange([...value, { input: '', expectedOutput: '', isSample: false }])
  }

  function update(i: number, field: keyof TestCase, v: string | boolean) {
    const next = value.map((tc, idx) => idx === i ? { ...tc, [field]: v } : tc)
    onChange(next)
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  async function handleZip(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const JSZip = (await import('jszip')).default
      const zip = await JSZip.loadAsync(file)
      const inputs: Record<string, string> = {}
      const outputs: Record<string, string> = {}
      for (const [name, zipFile] of Object.entries(zip.files)) {
        const content = await zipFile.async('string')
        const base = name.replace(/\.(in|out|txt)$/, '')
        if (name.endsWith('.in') || name.includes('input')) inputs[base] = content
        if (name.endsWith('.out') || name.includes('output')) outputs[base] = content
      }
      const cases = Object.keys(inputs).sort().map((k) => ({
        input: inputs[k],
        expectedOutput: outputs[k] ?? '',
        isSample: false,
      }))
      if (cases.length) onChange(cases)
    } catch (err) {
      console.error('ZIP parse error:', err)
    }
    e.target.value = ''
  }

  return (
    <div>
      <div className="tabs" style={{ marginBottom: 10 }}>
        <button className={tab === 'manual' ? 'active' : ''} onClick={() => setTab('manual')}>Nhập tay</button>
        <button className={tab === 'zip' ? 'active' : ''} onClick={() => setTab('zip')}>Upload ZIP</button>
      </div>

      {tab === 'zip' && (
        <div className="field" style={{ marginBottom: 14 }}>
          <label>File ZIP (*.in/*.out hoặc input*/output*)</label>
          <input type="file" accept=".zip" onChange={handleZip} style={{ padding: 8 }} />
        </div>
      )}

      <div id="testList">
        {value.map((tc, i) => (
          <div key={i} className="test-case">
            <div className="field">
              <label>Input {i + 1}</label>
              <textarea
                className="textarea"
                placeholder="Input"
                value={tc.input}
                onChange={(e) => update(i, 'input', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Expected Output {i + 1}</label>
              <textarea
                className="textarea"
                placeholder="Expected output"
                value={tc.expectedOutput}
                onChange={(e) => update(i, 'expectedOutput', e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 22 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={tc.isSample}
                  onChange={(e) => update(i, 'isSample', e.target.checked)}
                />
                Sample
              </label>
              <button className="icon-btn" type="button" onClick={() => remove(i)} style={{ color: 'var(--danger)' }}>×</button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="secondary-btn" onClick={add} style={{ marginTop: 10 }}>
        + Thêm test case
      </button>
    </div>
  )
}
