'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

interface NavbarProps {
  compact?: boolean
}

export default function Navbar({ compact }: NavbarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const initials = session?.user?.username?.slice(0, 2).toUpperCase() ?? '??'

  return (
    <header className={compact ? 'topbar compact-topbar' : 'topbar'}>
      <div className="nav-left">
        <Link href="/problems" prefetch={false} className="brand">
          <span className="logo-mark">&gt;_</span>
          <span>CP-Tutor</span>
        </Link>
        <nav className="nav-links">
          <Link href="/problems" prefetch={false} className={pathname.startsWith('/problems') ? 'active' : ''}>
            Bài tập
          </Link>
          <Link href="/submissions" prefetch={false} className={pathname.startsWith('/submissions') ? 'active' : ''}>
            Bài nộp của tôi
          </Link>
          {session?.user?.role === 'admin' && (
            <Link href="/admin/problems" prefetch={false} className={pathname.startsWith('/admin') ? 'active' : ''}>
              Admin
            </Link>
          )}
        </nav>
      </div>

      <div className="nav-user" style={{ position: 'relative' }}>
        <span className="muted" style={{ fontSize: 13 }}>{session?.user?.username}</span>
        <button
          className="avatar ghost-btn"
          style={{ border: 'none', minHeight: 32, padding: 0 }}
          onClick={() => setDropdownOpen((open) => !open)}
        >
          {initials}
        </button>
        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              minWidth: 140,
              zIndex: 50,
              padding: '4px 0',
            }}
          >
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 14px',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                color: 'var(--danger)',
                cursor: 'pointer',
              }}
            >
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
