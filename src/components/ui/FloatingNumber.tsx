import { useEffect, useRef, useState } from 'react'
import styles from './FloatingNumber.module.css'

interface FloatingNumberProps {
  /** When this value changes (other than 0), spawn a floating number. */
  trigger: number
  /** Text to display, e.g. "+15 XP". */
  label: string
  /** ms to keep visible. Defaults to 900. */
  durationMs?: number
}

/**
 * Renders a small floating "+N XP" element above its parent that fades and
 * rises on each `trigger` change. Respects `prefers-reduced-motion` (still
 * shows the number, just without the rise/fade animation).
 */
export function FloatingNumber({ trigger, label, durationMs = 900 }: FloatingNumberProps) {
  const [visible, setVisible] = useState(false)
  const idRef = useRef(0)

  useEffect(() => {
    if (!trigger) return
    idRef.current += 1
    const myId = idRef.current
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true)
    const timer = window.setTimeout(() => {
      // Only hide if no newer trigger replaced us.
      if (idRef.current === myId) setVisible(false)
    }, durationMs)
    return () => window.clearTimeout(timer)
  }, [trigger, durationMs])

  if (!visible) return null

  return (
    <span
      key={trigger}
      className={styles.floater}
      role="status"
      aria-live="polite"
      style={{ animationDuration: `${durationMs}ms` }}
    >
      {label}
    </span>
  )
}
