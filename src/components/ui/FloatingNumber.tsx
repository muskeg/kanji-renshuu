import { useEffect, useState } from 'react'
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
 *
 * The element is removed after `durationMs`. Re-keyed on `trigger` so each
 * change spawns a fresh animation.
 */
export function FloatingNumber({ trigger, label, durationMs = 900 }: FloatingNumberProps) {
  const [visibleFor, setVisibleFor] = useState<number | null>(null)

  useEffect(() => {
    if (!trigger) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleFor(trigger)
    const timer = window.setTimeout(() => {
      setVisibleFor((current) => (current === trigger ? null : current))
    }, durationMs)
    return () => window.clearTimeout(timer)
  }, [trigger, durationMs])

  if (visibleFor === null) return null

  return (
    <span
      key={visibleFor}
      className={styles.floater}
      role="status"
      aria-live="polite"
      style={{ animationDuration: `${durationMs}ms` }}
    >
      {label}
    </span>
  )
}
