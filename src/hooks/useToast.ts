import { useState, useEffect, useCallback, useRef } from 'react'

export interface ToastData {
  id: string
  title: string
  body: string
  icon: string
}

let toastCounter = 0

/** Show a toast from anywhere (dispatches a DOM event) */
export function showToast(toast: Omit<ToastData, 'id'>): void {
  toastCounter++
  const detail: ToastData = { ...toast, id: `toast-${toastCounter}` }
  window.dispatchEvent(new CustomEvent('kanji-show-toast', { detail }))
}

/** Listens for toast events and manages the toast queue with auto-dismiss */
export function useToastListener() {
  const [toasts, setToasts] = useState<ToastData[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  useEffect(() => {
    const timers = timersRef.current

    function handleToast(e: Event) {
      const toast = (e as CustomEvent<ToastData>).detail
      setToasts(prev => [...prev, toast])

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
        timers.delete(toast.id)
      }, 5000)
      timers.set(toast.id, timer)
    }

    window.addEventListener('kanji-show-toast', handleToast)
    return () => {
      window.removeEventListener('kanji-show-toast', handleToast)
      for (const timer of timers.values()) {
        clearTimeout(timer)
      }
    }
  }, [])

  return { toasts, dismissToast }
}
