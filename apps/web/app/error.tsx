'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="error-shell">
      <div className="error-box">
        <div className="error-code" style={{ fontSize: 'clamp(60px, 10vw, 120px)' }}>Lỗi</div>
        <h2 style={{ fontFamily: 'var(--font-display)', marginTop: 16 }}>Có lỗi xảy ra</h2>
        <p className="muted">{error.message || 'Vui lòng thử lại.'}</p>
        <div className="row" style={{ justifyContent: 'center', marginTop: 20 }}>
          <button className="secondary-btn" onClick={reset}>Thử lại</button>
          <Link href="/problems" className="ghost-btn">Về trang chủ</Link>
        </div>
      </div>
    </div>
  )
}
