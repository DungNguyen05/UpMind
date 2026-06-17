import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="error-shell">
      <div className="error-box">
        <div className="error-code">&gt;_404</div>
        <h2 style={{ fontFamily: 'var(--font-display)', marginTop: 16 }}>Trang không tìm thấy</h2>
        <p className="muted">Đường dẫn này không tồn tại hoặc đã bị xóa.</p>
        <Link href="/problems" className="primary-btn" style={{ display: 'inline-flex', marginTop: 20 }}>
          Về trang bài tập
        </Link>
      </div>
    </div>
  )
}
