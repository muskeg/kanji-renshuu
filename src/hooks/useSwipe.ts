import { useEffect, useRef } from 'react'

export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

export interface SwipeHandlers {
  onSwipe?: (dir: SwipeDirection) => void
  /** Minimum distance (px) for a gesture to register. */
  threshold?: number
  /** Maximum off-axis drift (px) before a swipe is rejected. */
  maxOffAxis?: number
  /** Whether the listener is active. */
  enabled?: boolean
}

/**
 * Attach touch swipe detection to a target element. Returns a ref to attach
 * to the DOM node you want to observe.
 */
export function useSwipe<T extends HTMLElement = HTMLElement>(handlers: SwipeHandlers) {
  const { onSwipe, threshold = 50, maxOffAxis = 80, enabled = true } = handlers
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled || !onSwipe) return

    let startX = 0
    let startY = 0
    let active = false

    function handleStart(e: TouchEvent) {
      if (e.touches.length !== 1) return
      active = true
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    function handleEnd(e: TouchEvent) {
      if (!active) return
      active = false
      const t = e.changedTouches[0]
      if (!t) return
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)

      if (absX > absY) {
        if (absX < threshold || absY > maxOffAxis) return
        onSwipe?.(dx > 0 ? 'right' : 'left')
      } else {
        if (absY < threshold || absX > maxOffAxis) return
        onSwipe?.(dy > 0 ? 'down' : 'up')
      }
    }

    el.addEventListener('touchstart', handleStart, { passive: true })
    el.addEventListener('touchend', handleEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', handleStart)
      el.removeEventListener('touchend', handleEnd)
    }
  }, [onSwipe, threshold, maxOffAxis, enabled])

  return ref
}
