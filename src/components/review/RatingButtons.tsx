import { useMemo, useRef, useState } from 'react'
import type { Card } from 'ts-fsrs'
import type { RatingValue } from '@/core/srs/types'
import { previewCard } from '@/core/srs/scheduler'
import { useTranslation } from '@/i18n'
import { XP_PER_RATING } from '@/core/gamification/xp'
import { FloatingNumber } from '@/components/ui/FloatingNumber'
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

const BUTTONS: { rating: RatingValue; labelKey: 'rating.again' | 'rating.hard' | 'rating.good' | 'rating.easy'; key: string; style: string }[] = [
  { rating: 1, labelKey: 'rating.again', key: '1', style: styles.again },
  { rating: 2, labelKey: 'rating.hard', key: '2', style: styles.hard },
  { rating: 3, labelKey: 'rating.good', key: '3', style: styles.good },
  { rating: 4, labelKey: 'rating.easy', key: '4', style: styles.easy },
]

export function RatingButtons({ card, onRate, disabled }: RatingButtonsProps) {
  const { t } = useTranslation()
  const previews = useMemo(() => {
    try {
      return previewCard(card)
    } catch {
      return null
    }
  }, [card])

  // Track which rating the user just clicked so we can pop a floating "+N XP"
  // chip from that specific button. The counter ensures repeat clicks
  // re-trigger the animation.
  const [lastRated, setLastRated] = useState<RatingValue | null>(null)
  const counterRef = useRef(0)
  const [counter, setCounter] = useState(0)

  function handleRate(rating: RatingValue) {
    counterRef.current += 1
    setCounter(counterRef.current)
    setLastRated(rating)
    onRate(rating)
  }

  return (
    <div className={styles.container} role="group" aria-label={t('rating.rateRecall')}>
      {BUTTONS.map(({ rating, labelKey, key, style }) => {
        const label = t(labelKey)
        const previewItem = previews?.[rating as keyof typeof previews]
        const preview = previewItem && typeof previewItem === 'object' && 'card' in previewItem ? previewItem : null
        const interval = preview ? formatInterval(preview.card) : ''

        return (
          <button
            key={rating}
            className={`${styles.button} ${style}`}
            onClick={() => handleRate(rating)}
            disabled={disabled}
            aria-label={t('rating.nextReview', { label, interval })}
            style={{ position: 'relative' }}
          >
            <span className={styles.label}>{label}</span>
            <span className={styles.shortcut}>{key}</span>
            {interval && <span className={styles.preview}>{interval}</span>}
            {lastRated === rating && (
              <FloatingNumber
                trigger={counter}
                label={t('xp.gain', { amount: XP_PER_RATING[rating] })}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
