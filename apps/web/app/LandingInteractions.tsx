'use client'

import { useEffect } from 'react'

export default function LandingInteractions() {
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
