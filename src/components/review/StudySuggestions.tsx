import type { QueueStatus } from '@/core/srs/types'
import { useSuggestions } from '@/hooks/useSuggestions'
import styles from './StudySuggestions.module.css'

interface StudySuggestionsProps {
  status: QueueStatus
  onStart?: () => void
}

export function StudySuggestions({ status, onStart }: StudySuggestionsProps) {
  const suggestions = useSuggestions(status)

  if (suggestions.length === 0) return null

  return (
    <div className={styles.container}>
      <div className={styles.heading}>Suggested next</div>
      {suggestions.map((s, i) => {
        const isClickable = s.action === 'start' && onStart
        return (
          <button
            key={i}
            className={isClickable ? styles.itemClickable : styles.item}
            onClick={isClickable ? onStart : undefined}
            type="button"
            disabled={!isClickable}
          >
            <span className={styles.icon}>{s.icon}</span>
            <span>{s.text}</span>
          </button>
        )
      })}
    </div>
  )
}
