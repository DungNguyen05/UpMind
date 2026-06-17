'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'

interface Problem {
  id: string
  title: string
  slug: string
  difficulty: string
  topics: { name: string; slug: string }[]
  submissionCount: number
  userStatus: 'ac' | 'tried' | 'none'
}

interface Props {
  initialProblems: Problem[]
  allTopics: { name: string; slug: string }[]
}

const STATUS_ICON: Record<string, string> = { ac: '✓', tried: '○', none: '' }
const STATUS_COLOR: Record<string, string> = {
  ac: 'var(--accent-2)',
  tried: 'var(--warning)',
  none: 'var(--faint)',
}

export default function ProblemTable({ initialProblems, allTopics }: Props) {
  const [problems, setProblems] = useState(initialProblems)
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('all')
  const [activeTopic, setActiveTopic] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchProblems = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (difficulty !== 'all') params.set('difficulty', difficulty)
    if (activeTopic) params.set('topics', activeTopic)
    try {
      const res = await fetch(`/api/problems?${params}`)
      const data = await res.json()
      setProblems(data.problems ?? [])
    } finally {
      setLoading(false)
    }
  }, [search, difficulty, activeTopic])

  useEffect(() => {
    const t = setTimeout(fetchProblems, 300)
    return () => clearTimeout(t)
  }, [fetchProblems])

  const acCount = initialProblems.filter((p) => p.userStatus === 'ac').length
  const triedCount = initialProblems.filter((p) => p.userStatus === 'tried').length

  return (
    <>
      <div className="page-head">
        <div className="page-title">
          <h1>Bài tập</h1>
        </div>
        <div className="row">
          <span className="stat-chip">
            Tổng <strong>{initialProblems.length}</strong>
          </span>
          <span className="stat-chip">
            AC <strong style={{ color: 'var(--accent-2)' }}>{acCount}</strong>
          </span>
          <span className="stat-chip">
            Đang làm <strong style={{ color: 'var(--warning)' }}>{triedCount}</strong>
          </span>
        </div>
      </div>

      <div className="controls">
        <input
          className="search"
          placeholder="Tìm bài..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="row">
          {['all', 'easy', 'medium', 'hard'].map((d) => (
            <button
              key={d}
              className={`pill${difficulty === d ? ' active' : ''}`}
              onClick={() => setDifficulty(d)}
            >
              {d === 'all' ? 'Tất cả' : d === 'easy' ? 'Dễ' : d === 'medium' ? 'Vừa' : 'Khó'}
            </button>
          ))}
        </div>
      </div>

      <div className="tag-scroll">
        <div className="chip-row">
          <button
            className={`tag${!activeTopic ? ' active' : ''}`}
            onClick={() => setActiveTopic('')}
          >
            Tất cả
          </button>
          {allTopics.map((t) => (
            <button
              key={t.slug}
              className={`tag${activeTopic === t.slug ? ' active' : ''}`}
              onClick={() => setActiveTopic(activeTopic === t.slug ? '' : t.slug)}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>Đang tải...</div>
        ) : problems.length === 0 ? (
          <div className="empty">
            <strong>Không có bài nào</strong>
            <p>Thử xóa filter hoặc tìm kiếm khác.</p>
            <button className="secondary-btn" onClick={() => { setSearch(''); setDifficulty('all'); setActiveTopic('') }}>
              Xóa filter
            </button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th style={{ width: 48 }}>#</th>
                <th>Tên bài</th>
                <th>Độ khó</th>
                <th style={{ width: 80 }}>Nộp bài</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p, i) => (
                <tr key={p.id} data-row>
                  <td style={{ color: STATUS_COLOR[p.userStatus], fontWeight: 700, textAlign: 'center' }}>
                    {STATUS_ICON[p.userStatus]}
                  </td>
                  <td className="mono muted">{i + 1}</td>
                  <td>
                    <Link href={`/problems/${p.slug}`} className="problem-name">
                      {p.title}
                    </Link>
                    <div className="sub-tags">
                      {p.topics.map((t) => <span key={t.slug}>{t.name}</span>)}
                    </div>
                  </td>
                  <td>
                    <Badge verdict={p.difficulty} />
                  </td>
                  <td className="mono muted">{p.submissionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
