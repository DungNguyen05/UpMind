'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import Navbar from '@/components/layout/Navbar'
import TestCaseEditor from '@/components/admin/TestCaseEditor'
import { useToast } from '@/components/ui/Toast'

interface TestCase { input: string; expectedOutput: string; isSample: boolean }

const AUTOSAVE_KEY = 'admin-new-problem-draft'

export default function NewProblemPage() {
  const router = useRouter()
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [difficulty, setDifficulty] = useState('easy')
  const [timeLimitMs, setTimeLimitMs] = useState(1000)
  const [memoryLimitMb, setMemoryLimitMb] = useState(256)
  const [description, setDescription] = useState('')
  const [testCases, setTestCases] = useState<TestCase[]>([{ input: '', expectedOutput: '', isSample: true }])
  const [saving, setSaving] = useState(false)
  const autosaveRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    const draft = localStorage.getItem(AUTOSAVE_KEY)
    if (draft) { try { const d = JSON.parse(draft); setTitle(d.title ?? ''); setSlug(d.slug ?? ''); setDescription(d.description ?? '') } catch {} }
  }, [])

  useEffect(() => {
    autosaveRef.current = setInterval(() => {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ title, slug, description }))
    }, 30000)
    return () => clearInterval(autosaveRef.current)
  }, [title, slug, description])

  async function save(publish: boolean) {
    if (!title || !slug) return toast('Cần điền Tiêu đề và Slug', 'error')
    setSaving(true)
    try {
      const res = await fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, difficulty, description, timeLimitMs, memoryLimitMb }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      const problem = await res.json()
      if (testCases.some((tc) => tc.input)) {
        await fetch(`/api/problems/${problem.slug}/testcases`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testCases }),
        })
      }
      if (publish) {
        await fetch(`/api/problems/${problem.slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublished: true }),
        })
      }
      localStorage.removeItem(AUTOSAVE_KEY)
      toast(publish ? 'Đã publish bài!' : 'Đã lưu nháp!', 'success')
      router.push('/admin/problems')
    } catch (err: any) {
      toast(err.message ?? 'Lỗi', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app-shell">
      <Navbar />
      <main className="wide-main" style={{ marginTop: 28 }}>
        <div className="page-head">
          <div className="page-title"><h1>Thêm bài mới</h1></div>
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
                <div className="field"><label>Tiêu đề</label><input value={title} onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')) }} /></div>
                <div className="field"><label>Slug</label><input value={slug} onChange={(e) => setSlug(e.target.value)} /></div>
                <div className="field">
                  <label>Độ khó</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="easy">Dễ</option>
                    <option value="medium">Vừa</option>
                    <option value="hard">Khó</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="field"><label>Time limit (ms)</label><input type="number" value={timeLimitMs} onChange={(e) => setTimeLimitMs(+e.target.value)} /></div>
                  <div className="field"><label>Memory limit (MB)</label><input type="number" value={memoryLimitMb} onChange={(e) => setMemoryLimitMb(+e.target.value)} /></div>
                </div>
              </div>
            </div>
            <div className="form-section">
              <div className="section-title">Đề bài (Markdown)</div>
              <textarea className="textarea" style={{ minHeight: 260, width: '100%' }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="## Mô tả&#10;..." />
            </div>
            <div className="form-section">
              <div className="section-title">Test cases</div>
              <TestCaseEditor value={testCases} onChange={setTestCases} />
            </div>
          </div>
          <div className="preview panel">
            <div className="section-title">Preview</div>
            <div className="markdown-preview">
              <h2>{title || 'Tiêu đề bài'}</h2>
              <ReactMarkdown>{description || '*Đề bài sẽ hiện ở đây...*'}</ReactMarkdown>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
