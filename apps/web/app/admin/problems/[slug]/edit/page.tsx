'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import TestCaseEditor from '@/components/admin/TestCaseEditor'
import { useToast } from '@/components/ui/Toast'
import LazyMarkdown from '@/components/ui/LazyMarkdown'

interface TestCase { input: string; expectedOutput: string; isSample: boolean }

export default function EditProblemPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState('easy')
  const [timeLimitMs, setTimeLimitMs] = useState(1000)
  const [memoryLimitMb, setMemoryLimitMb] = useState(256)
  const [description, setDescription] = useState('')
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/problems/${params.slug}`).then((r) => r.json()).then((p) => {
      setTitle(p.title); setDifficulty(p.difficulty); setTimeLimitMs(p.timeLimitMs)
      setMemoryLimitMb(p.memoryLimitMb); setDescription(p.description)
      setTestCases(p.testCases?.map((tc: any) => ({ input: tc.input, expectedOutput: tc.expectedOutput, isSample: tc.isSample })) ?? [])
    }).finally(() => setLoading(false))
  }, [params.slug])

  async function save(publish?: boolean) {
    setSaving(true)
    try {
      const body: any = { title, difficulty, timeLimitMs, memoryLimitMb, description }
      if (publish !== undefined) body.isPublished = publish
      await fetch(`/api/problems/${params.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      toast('Đã lưu!', 'success')
      router.push('/admin/problems')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Đang tải...</div>

  return (
    <div className="app-shell">
      <Navbar />
      <main className="wide-main" style={{ marginTop: 28 }}>
        <div className="page-head">
          <div className="page-title"><h1>Chỉnh sửa: {title}</h1></div>
          <div className="row">
            <button className="secondary-btn" disabled={saving} onClick={() => save(false)}>Lưu nháp</button>
            <button className="primary-btn" disabled={saving} onClick={() => save(true)}>Publish</button>
          </div>
        </div>
        <div className="admin-grid">
          <div className="panel" style={{ padding: 0 }}>
            <div className="form-section">
              <div className="section-title">Thông tin cơ bản</div>
              <div className="form-grid">
                <div className="field"><label>Tiêu đề</label><input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                <div className="field"><label>Độ khó</label><select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}><option value="easy">Dễ</option><option value="medium">Vừa</option><option value="hard">Khó</option></select></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="field"><label>Time limit (ms)</label><input type="number" value={timeLimitMs} onChange={(e) => setTimeLimitMs(+e.target.value)} /></div>
                  <div className="field"><label>Memory limit (MB)</label><input type="number" value={memoryLimitMb} onChange={(e) => setMemoryLimitMb(+e.target.value)} /></div>
                </div>
              </div>
            </div>
            <div className="form-section">
              <div className="section-title">Đề bài (Markdown)</div>
              <textarea className="textarea" style={{ minHeight: 260, width: '100%' }} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="form-section">
              <div className="section-title">Test cases</div>
              <TestCaseEditor value={testCases} onChange={setTestCases} />
            </div>
          </div>
          <div className="preview panel">
            <div className="section-title">Preview</div>
            <div className="markdown-preview">
              <h2>{title}</h2>
              <LazyMarkdown>{description}</LazyMarkdown>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
