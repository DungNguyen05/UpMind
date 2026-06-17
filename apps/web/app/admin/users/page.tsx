'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import { useToast } from '@/components/ui/Toast'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface User {
  id: string
  username: string
  email: string
  role: string
  createdAt: string
  _count: { submissions: number }
}

export default function AdminUsersPage() {
  const toast = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    setLoading(true)
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .finally(() => setLoading(false))
  }, [search])

  async function changeRole(id: string, role: string) {
    const res = await fetch(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u))
      toast('Đã cập nhật role', 'success')
    }
  }

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main">
        <div className="page-head">
          <div className="page-title"><h1>Quản lý người dùng</h1></div>
          <span className="stat-chip">Tổng <strong>{users.length}</strong></span>
        </div>
        <div className="controls">
          <input
            className="search"
            placeholder="Tìm username hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="table-card">
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>Đang tải...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Nộp bài</th>
                  <th>Ngày đăng ký</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} data-row>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{u.username}</td>
                    <td className="muted">{u.email}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--fg)', padding: '4px 8px' }}
                      >
                        <option value="student">student</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="mono">{u._count.submissions}</td>
                    <td className="muted" style={{ fontSize: 12 }}>
                      {formatDistanceToNow(new Date(u.createdAt), { locale: vi, addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
