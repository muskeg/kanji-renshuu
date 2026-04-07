import { useState } from 'react'
import type { SessionSummaryData } from '@/core/srs/types'
import styles from './SessionSummary.module.css'

interface SessionSummaryProps {
  summary: SessionSummaryData
  onDone: () => void
  onRetryStruggled: (() => void) | null
  onNewSession: () => void
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${remainingSeconds}s`
}

export function SessionSummary({ summary, onDone, onRetryStruggled, onNewSession }: SessionSummaryProps) {
  const [showStruggled, setShowStruggled] = useState(false)
  const accuracy = summary.totalReviewed > 0
    ? Math.round((summary.correctCount / summary.totalReviewed) * 100)
    : 0

  const struggled = summary.reviewedCards.filter(c => c.rating <= 2)

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Session Complete</h2>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={`${styles.statValue} ${accuracy >= 80 ? styles.accuracy : styles.accuracyLow}`}>
            {accuracy}%
          </div>
          <div className={styles.statLabel}>Accuracy</div>
        </div>

        <div className={styles.stat}>
          <div className={styles.statValue}>{summary.totalReviewed}</div>
          <div className={styles.statLabel}>Cards Reviewed</div>
        </div>

        <div className={styles.stat}>
          <div className={styles.statValue}>{summary.newCardsIntroduced}</div>
          <div className={styles.statLabel}>New Cards</div>
        </div>

        <div className={styles.stat}>
          <div className={styles.statValue}>{formatTime(summary.totalTimeMs)}</div>
          <div className={styles.statLabel}>Time Spent</div>
        </div>
      </div>

      <div className={styles.breakdown}>
        <div className={styles.breakdownItem}>
          <span className={`${styles.dot} ${styles.dotAgain}`} />
          Again: {summary.againCount}
        </div>
        <div className={styles.breakdownItem}>
          <span className={`${styles.dot} ${styles.dotHard}`} />
          Hard: {summary.hardCount}
        </div>
        <div className={styles.breakdownItem}>
          <span className={`${styles.dot} ${styles.dotGood}`} />
          Good: {summary.goodCount}
        </div>
        <div className={styles.breakdownItem}>
          <span className={`${styles.dot} ${styles.dotEasy}`} />
          Easy: {summary.easyCount}
        </div>
      </div>

      {/* Struggled cards section */}
      {struggled.length > 0 ? (
        <div className={styles.struggled}>
          <button
            className={styles.toggleButton}
            onClick={() => setShowStruggled(s => !s)}
            type="button"
          >
            {showStruggled ? '▾' : '▸'} Struggled Cards ({struggled.length})
          </button>
          {showStruggled && (
            <div className={styles.struggledList}>
              {struggled.map(card => (
                <div key={card.kanjiLiteral} className={styles.struggledCard}>
                  <span className={styles.struggledKanji}>{card.kanjiLiteral}</span>
                  <span className={styles.struggledReading}>
                    {card.readings.onYomi[0] ?? card.readings.kunYomi[0] ?? ''}
                  </span>
                  <span className={styles.struggledMeaning}>
                    {card.meanings[0] ?? ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className={styles.perfect}>Perfect session! 🎯</p>
      )}

      <div className={styles.actions}>
        {onRetryStruggled && (
          <button className={styles.buttonSecondary} onClick={onRetryStruggled}>
            Review Struggled Cards
          </button>
        )}
        <button className={styles.buttonSecondary} onClick={onNewSession}>
          Start New Session
        </button>
        <button className={styles.button} onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  )
}
