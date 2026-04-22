import { useEffect, useState } from 'react'
import type { ReviewLogEntry, RatingValue, QuizMode } from '@/core/srs/types'
import { getAllReviewLogs } from '@/core/storage/db'
import styles from './CardHistoryModal.module.css'

interface CardHistoryModalProps {
  literal: string
  onClose: () => void
}

const RATING_LABELS: Record<RatingValue, { label: string; cls: string }> = {
  1: { label: 'Again', cls: 'again' },
  2: { label: 'Hard', cls: 'hard' },
  3: { label: 'Good', cls: 'good' },
  4: { label: 'Easy', cls: 'easy' },
}

const MODE_SHORT: Record<QuizMode, string> = {
  recognition: 'Flash',
  meaning: 'Meaning',
  reading: 'Reading',
  writing: 'Writing',
  cloze: 'Cloze',
}

function formatRelative(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export function CardHistoryModal({ literal, onClose }: CardHistoryModalProps) {
  const [entries, setEntries] = useState<ReviewLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getAllReviewLogs().then(all => {
      if (cancelled) return
      const filtered = all
        .filter(l => l.kanjiLiteral === literal)
        .sort((a, b) => b.timestamp - a.timestamp)
      setEntries(filtered)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [literal])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const reviews = entries.length
  const correct = entries.filter(e => e.rating >= 3).length
  const accuracy = reviews > 0 ? Math.round((correct / reviews) * 100) : 0
  const avgTime = reviews > 0
    ? Math.round(entries.reduce((s, e) => s + e.responseTimeMs, 0) / reviews / 100) / 10
    : 0

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Review history for ${literal}`}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span className={styles.literal}>{literal}</span>
            <span>Review history</span>
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className={styles.summary}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{reviews}</span>
            <span className={styles.statLabel}>Reviews</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{reviews > 0 ? `${accuracy}%` : '—'}</span>
            <span className={styles.statLabel}>Accuracy</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{reviews > 0 ? `${avgTime}s` : '—'}</span>
            <span className={styles.statLabel}>Avg time</span>
          </div>
        </div>

        {loading ? null : entries.length === 0 ? (
          <div className={styles.empty}>No review history yet.</div>
        ) : (
          <div className={styles.timeline}>
            {entries.map(entry => {
              const rating = RATING_LABELS[entry.rating]
              return (
                <div key={entry.id} className={`${styles.entry} ${styles[rating.cls]}`}>
                  <div>
                    <span className={styles.entryRating}>{rating.label}</span>
                    {' · '}
                    <span className={styles.entryMode}>{MODE_SHORT[entry.mode]}</span>
                  </div>
                  <span className={styles.entryTime}>{formatRelative(entry.timestamp)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
