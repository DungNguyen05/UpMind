'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function getPasswordScore(v: string) {
  return Math.min(100, v.length * 10 + (/[A-Z]/.test(v) ? 20 : 0) + (/[0-9]/.test(v) ? 15 : 0))
}

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const usernameValid = /^[a-zA-Z0-9_]{4,}$/.test(username)
  const passwordScore = getPasswordScore(password)
  const confirmMismatch = confirm.length > 0 && confirm !== password

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!usernameValid) return setError('Username cần ít nhất 4 ký tự: chữ, số, gạch dưới')
    if (confirmMismatch || password !== confirm) return setError('Mật khẩu xác nhận không khớp')
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    })
    if (!res.ok) {
      const data = await res.json()
      setLoading(false)
      return setError(data.error ?? 'Đăng ký thất bại')
    }
    const signInRes = await signIn('credentials', { identifier: username, password, redirect: false })
    setLoading(false)
    if (signInRes?.error) {
      setError('Đăng ký thành công nhưng đăng nhập thất bại. Vui lòng đăng nhập lại.')
      router.push('/login')
      return
    }
    window.location.assign('/problems')
  }

  const strengthColor = passwordScore > 75 ? 'var(--accent-2)' : passwordScore > 45 ? 'var(--warning)' : 'var(--danger)'

  return (
    <main className="auth-shell">
      <Link className="brand" href="/problems" prefetch={false}>
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
          <h1>Đăng ký</h1>
          <p className="subtitle">Tạo tài khoản để bắt đầu học CP.</p>
          <div className="form-grid">
            <div className="field">
              <label>Username</label>
              <input
                id="username"
                required
                placeholder="student01"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={username.length > 0 ? { borderColor: usernameValid ? 'var(--accent-2)' : 'var(--danger)' } : undefined}
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                required
                placeholder="dung@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Mật khẩu</label>
              <div className="input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: 64 }}
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
              {password.length > 0 && (
                <div className="strength">
                  <span style={{ width: Math.max(20, passwordScore) + '%', background: strengthColor }} />
                </div>
              )}
            </div>
            <div className="field">
              <label>Xác nhận mật khẩu</label>
              <input
                id="confirmPassword"
                type="password"
                required
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={confirmMismatch ? { borderColor: 'var(--danger)' } : undefined}
              />
            </div>

            {error && <div className="error-note">{error}</div>}

            <button type="submit" className="primary-btn full" disabled={loading}>
              <span className="btn-text">{loading ? 'Đang đăng ký...' : 'Tạo tài khoản'}</span>
            </button>
          </div>
          <div className="helper-row">
            <span>Đã có tài khoản?</span>
            <Link href="/login" prefetch={false}>Đăng nhập</Link>
          </div>
        </form>
      </section>
    </main>
  )
}
