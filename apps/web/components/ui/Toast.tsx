'use client'

import { createContext, useCallback, useContext, useState, useEffect } from 'react'

interface ToastItem {
  id: number
  message: string
  type?: 'success' | 'error' | 'info'
}

const ToastContext = createContext<(msg: string, type?: ToastItem['type']) => void>(() => {})

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = ++nextId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }, [])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{ position: 'fixed', right: 18, bottom: 60, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className="toast"
            style={{
              display: 'block',
              position: 'static',
              borderColor: t.type === 'error' ? 'var(--danger)' : t.type === 'success' ? 'var(--accent-2)' : undefined,
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
