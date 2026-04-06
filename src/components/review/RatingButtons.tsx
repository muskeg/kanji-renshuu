import { useMemo } from 'react'
import type { Card } from 'ts-fsrs'
import type { RatingValue } from '@/core/srs/types'
import { previewCard } from '@/core/srs/scheduler'
import styles from './RatingButtons.module.css'

interface RatingButtonsProps {
  card: Card
  onRate: (rating: RatingValue) => void
  disabled?: boolean
}

function formatInterval(card: Card): string {
  const now = new Date()
  const due = new Date(card.due)
  const diffMs = due.getTime() - now.getTime()
  const diffMins = Math.round(diffMs / 60000)
  const diffHours = Math.round(diffMs / 3600000)
  const diffDays = Math.round(diffMs / 86400000)

  if (diffMins < 1) return '<1m'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  return `${diffDays}d`
}

const BUTTONS: { rating: RatingValue; label: string; key: string; style: string }[] = [
  { rating: 1, label: 'Again', key: '1', style: styles.again },
  { rating: 2, label: 'Hard', key: '2', style: styles.hard },
  { rating: 3, label: 'Good', key: '3', style: styles.good },
  { rating: 4, label: 'Easy', key: '4', style: styles.easy },
]

export function RatingButtons({ card, onRate, disabled }: RatingButtonsProps) {
  const previews = useMemo(() => {
    try {
      return previewCard(card)
    } catch {
      return null
    }
  }, [card])

  return (
    <div className={styles.container} role="group" aria-label="Rate your recall">
      {BUTTONS.map(({ rating, label, key, style }) => {
        const previewItem = previews?.[rating as keyof typeof previews]
        const preview = previewItem && typeof previewItem === 'object' && 'card' in previewItem ? previewItem : null
        const interval = preview ? formatInterval(preview.card) : ''

        return (
          <button
            key={rating}
            className={`${styles.button} ${style}`}
            onClick={() => onRate(rating)}
            disabled={disabled}
            aria-label={`${label} - next review in ${interval}`}
          >
            <span className={styles.label}>{label}</span>
            <span className={styles.shortcut}>{key}</span>
            {interval && <span className={styles.preview}>{interval}</span>}
          </button>
        )
      })}
    </div>
  )
}
