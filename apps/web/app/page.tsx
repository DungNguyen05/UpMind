'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import './landing.css'

export default function LandingPage() {
  useEffect(() => {
    const featSection = document.querySelector<HTMLElement>('.feat-scroll')
    const featTexts = Array.from(document.querySelectorAll<HTMLElement>('.feat-text'))
    const featAnims = Array.from(document.querySelectorAll<HTMLElement>('.feat-anim'))
    const featDots = Array.from(document.querySelectorAll<HTMLElement>('.feat-dot'))

    if (!featSection) return

    let currentStep = 0

    const setStep = (step: number) => {
      if (step === currentStep) return
      currentStep = step
      featTexts.forEach((el, i) => el.classList.toggle('is-active', i === step))
      featDots.forEach((el, i) => el.classList.toggle('is-active', i === step))
      featAnims.forEach(el => el.classList.remove('is-active'))
      void featSection.offsetHeight
      featAnims.forEach((el, i) => { if (i === step) el.classList.add('is-active') })
    }

    const onScroll = () => {
      const rect = featSection.getBoundingClientRect()
      const total = featSection.offsetHeight - window.innerHeight
      const scrolled = Math.max(0, -rect.top)
      const progress = Math.min(1, scrolled / Math.max(1, total))
      const step = Math.min(featAnims.length - 1, Math.floor(progress * featAnims.length))
      setStep(step)
    }

    const dotListeners: (() => void)[] = []
    featDots.forEach((dot, i) => {
      const listener = () => {
        const total = featSection.offsetHeight - window.innerHeight
        const targetY = featSection.offsetTop + total * (i / featAnims.length) + 1
        window.scrollTo({ top: targetY, behavior: 'smooth' })
      }
      dot.addEventListener('click', listener)
      dotListeners.push(listener)
    })

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      featDots.forEach((dot, i) => dot.removeEventListener('click', dotListeners[i]))
    }
  }, [])

  return (
    <>
      {/* ══════════ HERO ══════════ */}
      <main className="hero-shell">
        <section className="hero-stage" id="top">
          <div className="side-orb" aria-hidden="true"></div>

          <nav className="nav">
            <Link className="brand" href="/">
              <span className="brand-mark">&gt;_</span>
              <span>CP-Tutor</span>
            </Link>
            <div className="links">
              <a href="#features">Tính năng</a>
              <a href="#features">AI Mentor</a>
              <a href="#start">Bắt đầu</a>
            </div>
            <div className="nav-auth">
              <Link className="nav-login" href="/login">Đăng nhập</Link>
              <Link className="nav-cta" href="/register">Đăng ký</Link>
            </div>
          </nav>

          <section className="hero-grid">
            <div className="copy">
              <div className="kicker">Online Judge + AI Mentor</div>
              <h1>Luyện C++ CP với chấm bài và AI Mentor</h1>
              <p className="lead">CP-Tutor giúp học sinh đọc đề, viết C++17, nộp bài và nhận phân tích từ AI ngay trong một workspace gọn như IDE.</p>
              <div className="actions">
                <Link className="btn btn-primary" href="/register">Bắt đầu luyện C++</Link>
                <a className="btn btn-secondary" href="#features">Xem AI Mentor</a>
              </div>
            </div>

            <div className="visual">
              <div className="visual-halo" aria-hidden="true"></div>
              <div className="judge-3d" aria-hidden="true">
                <div className="platform"></div>
                <div className="orbit"></div>
                <div className="mentor-orb"></div>
                <div className="doc-card">
                  <div className="doc-head">
                    <span className="doc-icon">OJ</span>
                    <span>Problem</span>
                  </div>
                  <div className="doc-lines">
                    <span></span><span></span><span></span>
                  </div>
                  <div className="signature">#include</div>
                </div>
                <div className="lp-card">
                  <div className="lp-code-title">
                    <span>solution.cpp</span>
                    <span className="cpp-pill">C++17</span>
                  </div>
                  <div className="lp-code-line"><span>01</span><b style={{width:'76%',background:'#bbb8ff'}}></b></div>
                  <div className="lp-code-line"><span>02</span><b style={{width:'55%',background:'#6e748d'}}></b></div>
                  <div className="lp-code-line"><span>03</span><b style={{width:'86%',background:'#00d2a0'}}></b></div>
                  <div className="lp-code-line"><span>04</span><b style={{width:'44%',background:'#ffb340'}}></b></div>
                </div>
                <div className="ai-card">
                  <strong><span>AI Mentor</span><span>AC</span></strong>
                  <p>Phân tích độ phức tạp, chỉ ra lỗi biên và gợi ý hướng tối ưu.</p>
                  <div className="ai-progress"><span></span><span></span><span></span></div>
                </div>
                <div className="verdict-chip"><span>AC</span> 124ms · 8.2MB</div>
              </div>
            </div>
          </section>

          <section className="trust-row">
            <span><b></b>C++17 only</span>
            <span><b></b>Realtime verdict</span>
            <span><b></b>AI feedback</span>
            <span><b></b>Walkthrough</span>
            <span><b></b>Test cases</span>
            <span><b></b>Admin tools</span>
          </section>
        </section>
      </main>

      {/* ══════════ FEATURES SCROLL ══════════ */}
      <section className="feat-scroll" id="features">
        <div className="feat-viewport">

          {/* LEFT: sticky text panel */}
          <div className="feat-left">
            <div className="feat-section-label">Scroll để khám phá</div>
            <div className="feat-texts">

              <article className="feat-text is-active" data-step="0">
                <div className="feat-step-tag">
                  <span className="step-num">01</span>
                  AI Code Review
                </div>
                <h2 className="feat-title">AI rà soát từng dòng C++ của bạn</h2>
                <p className="feat-body">Sau khi nộp bài, AI Mentor không chỉ đọc verdict mà quét qua toàn bộ code — phát hiện lỗi biên, điều kiện dừng sai, vòng lặp thừa và đánh dấu chính xác dòng có vấn đề.</p>
                <ul className="feat-bullets">
                  <li>Highlight dòng nghi lỗi, không chỉ báo tên file</li>
                  <li>Giải thích tại sao dòng đó sai về mặt logic</li>
                  <li>Phân tích độ phức tạp và đề xuất sửa inline</li>
                </ul>
              </article>

              <article className="feat-text" data-step="1">
                <div className="feat-step-tag">
                  <span className="step-num">02</span>
                  Hint System
                </div>
                <h2 className="feat-title">Gợi ý có kiểm soát, không lộ đáp án</h2>
                <p className="feat-body">AI không paste lời giải. Bạn nhận hint theo tầng — từ gợi ý thử input nhỏ, đến kiểm tra invariant, rồi mới đề xuất kỹ thuật khi thực sự bí.</p>
                <ul className="feat-bullets">
                  <li>3 tầng hint từ đơn giản đến sâu</li>
                  <li>Không bao giờ đưa thẳng code hoàn chỉnh</li>
                  <li>Dẫn dắt tư duy thuật toán thay vì thay thế</li>
                </ul>
              </article>

              <article className="feat-text" data-step="2">
                <div className="feat-step-tag">
                  <span className="step-num">03</span>
                  Testcase Trace
                </div>
                <h2 className="feat-title">Truy vết chính xác testcase nào fail</h2>
                <p className="feat-body">Sau mỗi WA, hệ thống hiển thị đúng testcase fail, input cụ thể, output bạn trả ra và output đúng — side by side — rồi trỏ về dòng code đã gây ra lỗi đó.</p>
                <ul className="feat-bullets">
                  <li>Diff viewer expected vs actual, từng dòng</li>
                  <li>Trace ngược từ output sai về đoạn code nguồn</li>
                  <li>Không cần mò log hay chạy lại thủ công</li>
                </ul>
              </article>

            </div>
            <div className="feat-progress">
              <button className="feat-dot is-active" data-step="0" aria-label="Feature 1"></button>
              <button className="feat-dot" data-step="1" aria-label="Feature 2"></button>
              <button className="feat-dot" data-step="2" aria-label="Feature 3"></button>
            </div>
          </div>

          {/* RIGHT: animation panel */}
          <div className="feat-right">

            {/* ANIM 0: Code Scanner */}
            <div className="feat-anim is-active" data-step="0">
              <div className="anim-scanner">
                <div className="scanner-label">
                  <span className="sl-dot"></span>
                  AI đang phân tích code
                </div>
                <div className="scanner-editor">
                  <div className="se-titlebar">
                    <div className="se-dots"><span></span><span></span><span></span></div>
                    <span className="se-filename">solution.cpp</span>
                    <span className="se-lang">C++17</span>
                  </div>
                  <div className="se-body">
                    <div className="se-scanbar"></div>
                    <div className="se-lines">
                      <div className="se-line">
                        <span className="se-ln">01</span>
                        <span><span className="ck">while</span><span className="co">{' (l < r) {'}</span></span>
                      </div>
                      <div className="se-line">
                        <span className="se-ln">02</span>
                        <span>
                          <span className="co">{'  '}</span>
                          <span className="ck">int</span>
                          <span className="co">{' '}</span>
                          <span className="cv">sum</span>
                          <span className="co">{' = a[l] + a[r];'}</span>
                        </span>
                      </div>
                      <div className="se-line">
                        <span className="se-ln">03</span>
                        <span>
                          <span className="co">{'  '}</span>
                          <span className="ck">if</span>
                          <span className="co">{' (sum == target) {'}</span>
                        </span>
                      </div>
                      <div className="se-line is-bug-line">
                        <span className="se-ln">04</span>
                        <span>
                          <span className="co">{'    '}</span>
                          <span className="cv">l</span>
                          <span className="co">{'++; '}</span>
                          <span className="cbug">{'// ← thiếu r--'}</span>
                        </span>
                      </div>
                      <div className="se-line">
                        <span className="se-ln">05</span>
                        <span>
                          <span className="co">{'  } '}</span>
                          <span className="ck">else if</span>
                          <span className="co">{' (sum < target) l++;'}</span>
                        </span>
                      </div>
                      <div className="se-line">
                        <span className="se-ln">06</span>
                        <span>
                          <span className="co">{'  '}</span>
                          <span className="ck">else</span>
                          <span className="co"> r--;</span>
                        </span>
                      </div>
                      <div className="se-line">
                        <span className="se-ln">07</span>
                        <span><span className="co">{'}'}</span></span>
                      </div>
                    </div>
                    <div className="se-popup">
                      <div className="se-popup-title">
                        <span className="se-popup-icon">!</span>
                        Logic Error · Line 04
                      </div>
                      <p>Khi <code>sum == target</code>, chỉ tăng <code>l</code> mà không giảm <code>r</code> — bỏ sót tất cả cặp khi có phần tử trùng.</p>
                      <div className="se-popup-fix">Sửa thành: <code>{'l++; r--;'}</code></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ANIM 1: Hint Cards */}
            <div className="feat-anim" data-step="1">
              <div className="anim-hints">
                <div className="hints-header">
                  <span className="hh-wa">WA · Test 7</span>
                  <span className="hh-label">AI Mentor đề xuất hint…</span>
                </div>
                <div className="hints-stack">
                  <div className="hc hc-1">
                    <div className="hc-header">
                      <span className="hc-num">Hint 1</span>
                      <span className="hc-tag hc-tag-test">Thử nghiệm</span>
                    </div>
                    <p>Thử input nhỏ: <code>[2, 2, 3]</code>, target <code>4</code>. Trace từng bước vòng lặp để quan sát trạng thái l và r.</p>
                  </div>
                  <div className="hc hc-2">
                    <div className="hc-header">
                      <span className="hc-num">Hint 2</span>
                      <span className="hc-tag hc-tag-logic">Invariant</span>
                    </div>
                    <p>Khi tìm thấy cặp đúng, cần dịch <strong>cả hai</strong> con trỏ — không chỉ tăng <code>l</code> — để tránh đếm trùng.</p>
                  </div>
                  <div className="hc hc-3">
                    <div className="hc-header">
                      <span className="hc-num">Hint 3</span>
                      <span className="hc-tag hc-tag-algo">Kỹ thuật</span>
                    </div>
                    <p>Two pointers sau khi sort: <code>l++</code> khi tổng nhỏ hơn, <code>r--</code> khi lớn hơn, <code>{'l++ r--'}</code> khi bằng target.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ANIM 2: Diff Viewer */}
            <div className="feat-anim" data-step="2">
              <div className="anim-diff">
                <div className="diff-verdict">
                  <div className="dv-badge">
                    <span className="dv-badge-dot"></span>
                    <span className="dv-badge-text">WA · Wrong Answer</span>
                  </div>
                  <span className="dv-meta">Test 7 / 12 failed</span>
                </div>
                <div className="diff-grid">
                  <div className="diff-col">
                    <div className="diff-col-head expected">Expected output</div>
                    <div className="diff-lines">
                      <div className="diff-line dl-1"><span className="dl-ln">1</span>3 8</div>
                      <div className="diff-line dl-2"><span className="dl-ln">2</span>1 6</div>
                      <div className="diff-line dl-3"><span className="dl-ln">3</span>0 4</div>
                    </div>
                  </div>
                  <div className="diff-col">
                    <div className="diff-col-head actual">Your output</div>
                    <div className="diff-lines">
                      <div className="diff-line dl-1"><span className="dl-ln">1</span>3 8</div>
                      <div className="diff-line dl-2"><span className="dl-ln">2</span>1 6</div>
                      <div className="diff-line dl-3 dl-wrong"><span className="dl-ln">3</span>2 4</div>
                    </div>
                  </div>
                </div>
                <div className="diff-trace">
                  <div className="dt-icon">↑</div>
                  <div className="dt-body">
                    <div className="dt-label">Trace về nguồn lỗi</div>
                    <div className="dt-code">
                      <span className="se-ln" style={{color:'#555b70',fontSize:'11px'}}>{'04 '}</span>
                      <span className="ck">if</span>
                      <span className="co">{' (sum == target) '}</span>
                      <span className="cv">l</span>
                      <span className="co">{'++; '}</span>
                      <span className="arrow-label">{'← thiếu r--'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section className="landing-cta" id="start">
        <h2>Sẵn sàng luyện C++ với feedback rõ như một buổi review code?</h2>
        <p>Tạo tài khoản để bắt đầu làm bài, nộp C++17 và nhận phân tích từ AI Mentor ngay sau mỗi verdict.</p>
        <div className="actions cta-actions">
          <Link className="btn btn-primary" href="/register">Đăng ký ngay</Link>
          <Link className="btn btn-secondary" href="/login">Đăng nhập</Link>
        </div>
      </section>
    </>
  )
}
