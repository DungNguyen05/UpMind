'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
  const [activeTopics, setActiveTopics] = useState<string[]>([])
  const [topicSearch, setTopicSearch] = useState('')
  const [topicOpen, setTopicOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const topicPickerRef = useRef<HTMLDivElement>(null)

  const fetchProblems = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (difficulty !== 'all') params.set('difficulty', difficulty)
    if (activeTopics.length) params.set('topics', activeTopics.join(','))
    try {
      const res = await fetch(`/api/problems?${params}`)
      const data = await res.json()
      setProblems(data.problems ?? [])
    } finally {
      setLoading(false)
    }
  }, [search, difficulty, activeTopics])

  useEffect(() => {
    const t = setTimeout(fetchProblems, 300)
    return () => clearTimeout(t)
  }, [fetchProblems])

  useEffect(() => {
    const closeTopicPicker = (event: MouseEvent) => {
      if (!topicPickerRef.current?.contains(event.target as Node)) setTopicOpen(false)
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTopicOpen(false)
    }

    document.addEventListener('mousedown', closeTopicPicker)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeTopicPicker)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  const acCount = initialProblems.filter((p) => p.userStatus === 'ac').length
  const triedCount = initialProblems.filter((p) => p.userStatus === 'tried').length
  const selectedTopics = useMemo(
    () => allTopics.filter((topic) => activeTopics.includes(topic.slug)),
    [activeTopics, allTopics]
  )
  const filteredTopics = useMemo(() => {
    const keyword = topicSearch.trim().toLowerCase()
    if (!keyword) return allTopics
    return allTopics.filter((topic) => `${topic.name} ${topic.slug}`.toLowerCase().includes(keyword))
  }, [allTopics, topicSearch])
  const hasFilters = Boolean(search || difficulty !== 'all' || activeTopics.length)
  const topicLabel = selectedTopics.length
    ? selectedTopics.slice(0, 2).map((topic) => topic.name).join(', ') + (selectedTopics.length > 2 ? ` +${selectedTopics.length - 2}` : '')
    : 'Tất cả chủ đề'

  const toggleTopic = (slug: string) => {
    setActiveTopics((current) =>
      current.includes(slug) ? current.filter((topicSlug) => topicSlug !== slug) : [...current, slug]
    )
  }

  const resetFilters = () => {
    setSearch('')
    setDifficulty('all')
    setActiveTopics([])
    setTopicSearch('')
    setTopicOpen(false)
  }

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

      <div className="filter-panel">
        <label className="filter-search">
          <span>Tìm kiếm</span>
          <input
            className="search"
            placeholder="Tìm bài..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <div className="filter-group">
          <span className="filter-label">Độ khó</span>
          <div className="difficulty-tabs" role="group" aria-label="Lọc theo độ khó">
            {['all', 'easy', 'medium', 'hard'].map((d) => (
              <button
                key={d}
                className={`pill${difficulty === d ? ' active' : ''}`}
                onClick={() => setDifficulty(d)}
                type="button"
              >
                {d === 'all' ? 'Tất cả' : d === 'easy' ? 'Dễ' : d === 'medium' ? 'Vừa' : 'Khó'}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group topic-picker" ref={topicPickerRef}>
          <span className="filter-label">Chủ đề</span>
          <button
            type="button"
            className={`topic-trigger${topicOpen ? ' open' : ''}`}
            onClick={() => setTopicOpen((open) => !open)}
            aria-expanded={topicOpen}
            aria-haspopup="listbox"
          >
            <span className="topic-trigger-main">{topicLabel}</span>
            <span className="topic-chevron" aria-hidden="true">⌄</span>
          </button>

          {topicOpen && (
            <div className="topic-popover">
              <input
                className="topic-search"
                placeholder="Gõ để tìm chủ đề..."
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                autoFocus
              />
              <div className="topic-list" role="listbox" aria-label="Chọn chủ đề">
                <button
                  type="button"
                  className={`topic-option${!activeTopics.length ? ' selected' : ''}`}
                  onClick={() => setActiveTopics([])}
                  role="option"
                  aria-selected={!activeTopics.length}
                >
                  <span className={`topic-check${!activeTopics.length ? ' checked' : ''}`} aria-hidden="true" />
                  <span>Tất cả chủ đề</span>
                  <span className="topic-count">{allTopics.length}</span>
                </button>
                {filteredTopics.length ? (
                  filteredTopics.map((topic) => {
                    const selected = activeTopics.includes(topic.slug)
                    return (
                      <button
                        key={topic.slug}
                        type="button"
                        className={`topic-option${selected ? ' selected' : ''}`}
                        onClick={() => toggleTopic(topic.slug)}
                        role="option"
                        aria-selected={selected}
                      >
                        <span className={`topic-check${selected ? ' checked' : ''}`} aria-hidden="true" />
                        <span>{topic.name}</span>
                      </button>
                    )
                  })
                ) : (
                  <div className="topic-empty">Không tìm thấy chủ đề</div>
                )}
              </div>
              <div className="topic-actions">
                <button type="button" className="ghost-btn" onClick={() => setActiveTopics([])}>
                  Bỏ chọn
                </button>
                <button type="button" className="secondary-btn" onClick={() => setTopicOpen(false)}>
                  Xong
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {hasFilters && (
        <div className="active-filters" aria-live="polite">
          <span>Đang lọc</span>
          {difficulty !== 'all' && (
            <button type="button" className="filter-token" onClick={() => setDifficulty('all')}>
              {difficulty === 'easy' ? 'Dễ' : difficulty === 'medium' ? 'Vừa' : 'Khó'}
              <span aria-hidden="true">×</span>
            </button>
          )}
          {selectedTopics.map((topic) => (
            <button
              type="button"
              key={topic.slug}
              className="filter-token"
              onClick={() => setActiveTopics((current) => current.filter((slug) => slug !== topic.slug))}
            >
              {topic.name}
              <span aria-hidden="true">×</span>
            </button>
          ))}
          <button type="button" className="clear-filter-btn" onClick={resetFilters}>
            Xóa tất cả
          </button>
        </div>
      )}

      <div className="table-card">
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>Đang tải...</div>
        ) : problems.length === 0 ? (
          <div className="empty">
            <strong>Không có bài nào</strong>
            <p>Thử xóa filter hoặc tìm kiếm khác.</p>
            <button className="secondary-btn" onClick={resetFilters}>
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
