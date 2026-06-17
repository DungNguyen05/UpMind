'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/problems'
  const safeCallbackUrl = callbackUrl.startsWith('/') ? callbackUrl : '/problems'
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await signIn('credentials', { identifier, password, redirect: false })
      setLoading(false)
      if (res?.error) {
        setError('Sai tên đăng nhập hoặc mật khẩu.')
      } else {
        window.location.assign(safeCallbackUrl)
      }
    } catch {
      setLoading(false)
      setError('Lỗi kết nối. Vui lòng thử lại.')
    }
  }

  return (
    <main className="auth-shell">
      <Link className="brand" href="/problems">
        <span className="logo-mark">&gt;_</span>
        <span>CP-Tutor</span>
      </Link>
      <pre className="ascii-field">{`#include <bits/stdc++.h>
while (learning) {
  submit(solution.cpp);
  mentor.explain(verdict);
}`}</pre>
      <section className="auth-center">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1>Đăng nhập</h1>
          <p className="subtitle">Chào mừng trở lại với CP-Tutor.</p>
          <div className="form-grid">
            <div className="field">
              <label>Email hoặc username</label>
              <input
                required
                placeholder="student01 hoặc dung@email.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={error ? { borderColor: 'var(--danger)' } : undefined}
              />
            </div>
            <div className="field">
              <label>Mật khẩu</label>
              <div className="input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: 64, ...(error ? { borderColor: 'var(--danger)' } : {}) }}
                />
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{ position: 'absolute', right: 6, top: 5, minHeight: 30 }}
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            {error && <div className="error-note">{error}</div>}

            <button type="submit" className="primary-btn full" disabled={loading}>
              <span className="btn-text">{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
            </button>
          </div>
          <div className="helper-row">
            <span>Chưa có tài khoản?</span>
            <Link href="/register">Đăng ký</Link>
          </div>
        </form>
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
