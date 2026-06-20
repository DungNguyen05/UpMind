'use client'

import { useEffect } from 'react'

export default function LandingInteractions() {
  // Hero visual: flatten-on-hover + mouse parallax
  useEffect(() => {
    const visual    = document.querySelector<HTMLElement>('.visual')
    const rig       = document.querySelector<HTMLElement>('.parallax-rig')
    const judge     = document.querySelector<HTMLElement>('.judge-3d')
    const docCard   = document.querySelector<HTMLElement>('.doc-card')
    const codeCard  = document.querySelector<HTMLElement>('.judge-3d .code-card')
    const aiCard    = document.querySelector<HTMLElement>('.judge-3d .ai-card')
    const revStack  = document.querySelector<HTMLElement>('.review-stack')
    if (!visual || !rig || !judge) return

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const osc  = (time: number, period: number) => Math.sin((time / period) * 2 * Math.PI)

    // Mouse state (-1..1)
    let mx = 0, my = 0, tMx = 0, tMy = 0
    // 0 = isometric, 1 = flat
    let flat = 0
    let isHovered = false
    let t = 0, lastTs = 0, rafId = 0

    // Stop CSS animations that set `transform` (would conflict with inline style)
    visual.classList.add('js-animated')

    const tick = (now: number) => {
      const dt = lastTs ? Math.min((now - lastTs) / 1000, 0.05) : 0
      lastTs = now
      t += dt

      mx   = lerp(mx, isHovered ? tMx : 0, 0.09)
      my   = lerp(my, isHovered ? tMy : 0, 0.09)
      flat = lerp(flat, isHovered ? 1 : 0, 0.07)

      const inv = 1 - flat  // 1 when isometric, 0 when flat

      // Parallax rig: mouse tilt + centering offset (isometric cluster sits low → shift up)
      const centerY = lerp(0, 0, flat)
      const centerX = lerp(-30, 0, flat)
      rig.style.transform = `translateX(${centerX}px) translateY(${centerY}px) rotateX(${my * -3.5}deg) rotateY(${mx * 4.5}deg)`

      // Judge-3d: isometric → flat + float oscillation (amplitudes ×0.5)
      const floatY = osc(t, 7.8) * 6.5 * inv
      const floatZ = osc(t, 7.8) * 13 * inv
      judge.style.transform = `rotateX(${lerp(58, 0, flat)}deg) rotateZ(${lerp(-28, 0, flat)}deg) scale(1.3) translate3d(0,${-floatY}px,${floatZ}px)`

      // Doc card  CSS(214,38) → flat(221,0)
      if (docCard) {
        const bob = osc(t, 6.76) * 4 * inv
        docCard.style.transform = `translateX(${lerp(0, 7, flat)}px) translateY(${lerp(0, -38, flat) - bob}px) translateZ(${lerp(118, 60, flat)}px) rotateX(${lerp(-58, 0, flat)}deg) rotateZ(${lerp(28, 0, flat)}deg) rotateY(${lerp(-9, 0, flat)}deg)`
      }

      // Code card  CSS(88,120) → flat(16,0)
      if (codeCard) {
        const bob = osc(t, 5.98) * 3.5 * inv
        codeCard.style.transform = `translateX(${lerp(0, -72, flat)}px) translateY(${lerp(0, -120, flat) + bob}px) translateZ(${lerp(96, 40, flat)}px) rotateX(${lerp(-58, 0, flat)}deg) rotateZ(${lerp(28, 0, flat)}deg) rotateY(${lerp(7, 0, flat)}deg)`
      }

      // AI card  CSS(~260,~224) → flat(130,154)
      if (aiCard) {
        const bob = osc(t, 7.54) * 3.5 * inv
        aiCard.style.transform = `translateX(${lerp(0, -130, flat)}px) translateY(${lerp(0, -70, flat) - bob}px) translateZ(${lerp(106, 50, flat)}px) rotateX(${lerp(-58, 0, flat)}deg) rotateZ(${lerp(28, 0, flat)}deg) rotateY(${lerp(-7, 0, flat)}deg)`
      }

      // Review stack  CSS(44,375) → flat(60,284)
      if (revStack) {
        const bob = osc(t, 6.63) * 4 * inv
        revStack.style.transform = `translateX(${lerp(0, 16, flat)}px) translateY(${lerp(0, -91, flat) - bob}px) translateZ(${lerp(70, 20, flat)}px) rotateX(${lerp(-58, 0, flat)}deg) rotateZ(${lerp(28, 0, flat)}deg) rotateY(${lerp(-4, 0, flat)}deg)`
      }

      rafId = requestAnimationFrame(tick)
    }

    const onMove = (e: MouseEvent) => {
      const r = visual.getBoundingClientRect()
      tMx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
      tMy = (e.clientY - (r.top  + r.height / 2)) / (r.height / 2)
    }
    const onEnter = () => { isHovered = true;  visual.classList.add('is-hovered') }
    const onLeave = () => { isHovered = false; visual.classList.remove('is-hovered') }

    visual.addEventListener('mousemove',  onMove)
    visual.addEventListener('mouseenter', onEnter)
    visual.addEventListener('mouseleave', onLeave)

    rafId = requestAnimationFrame(tick)

    return () => {
      visual.removeEventListener('mousemove',  onMove)
      visual.removeEventListener('mouseenter', onEnter)
      visual.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(rafId)
      visual.classList.remove('js-animated')
      for (const el of [rig, judge, docCard, codeCard, aiCard, revStack]) {
        if (el) el.style.transform = ''
      }
    }
  }, [])

  useEffect(() => {
    const featSection = document.querySelector<HTMLElement>('.feat-scroll')
    const featTexts = Array.from(document.querySelectorAll<HTMLElement>('.feat-text'))
    const featAnims = Array.from(document.querySelectorAll<HTMLElement>('.feat-anim'))
    const featDots = Array.from(document.querySelectorAll<HTMLElement>('.feat-dot'))

    if (!featSection) return

    let currentStep = 0
    let ticking = false

    const setStep = (step: number) => {
      if (step === currentStep) return
      currentStep = step
      featTexts.forEach((el, i) => el.classList.toggle('is-active', i === step))
      featDots.forEach((el, i) => el.classList.toggle('is-active', i === step))
      featAnims.forEach((el, i) => el.classList.toggle('is-active', i === step))
    }

    const updateStep = () => {
      ticking = false
      const rect = featSection.getBoundingClientRect()
      const total = featSection.offsetHeight - window.innerHeight
      const scrolled = Math.max(0, -rect.top)
      const progress = Math.min(1, scrolled / Math.max(1, total))
      const step = Math.min(featAnims.length - 1, Math.floor(progress * featAnims.length))
      setStep(step)
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(updateStep)
    }

    const dotListeners: Array<() => void> = []
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
    updateStep()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      featDots.forEach((dot, i) => dot.removeEventListener('click', dotListeners[i]))
    }
  }, [])

  return null
}
