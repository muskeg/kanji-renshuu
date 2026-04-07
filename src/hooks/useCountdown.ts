import { useState, useEffect } from 'react'
import { formatRelativeTime } from '@/utils/time'

function compute(targetDate: Date | null): string | null {
  if (!targetDate || targetDate.getTime() <= Date.now()) return null
  return formatRelativeTime(targetDate)
}

/** Live countdown that updates every 60 seconds */
export function useCountdown(targetDate: Date | null): string | null {
  const [text, setText] = useState<string | null>(() => compute(targetDate))

  // Re-derive when targetDate identity changes
  const ts = targetDate?.getTime() ?? null
  useEffect(() => {
    if (ts === null) return

    // Set initial value in the interval callback, not synchronously
    const id = setInterval(() => {
      setText(compute(targetDate))
    }, 60_000)

    return () => clearInterval(id)
  }, [ts, targetDate])

  // Sync derived value on targetDate change (no effect setState needed)
  const current = compute(targetDate)
  if (current !== text) {
    setText(current)
  }

  return text
}
