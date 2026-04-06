import type { SessionSummaryData } from '@/core/srs/types'
import styles from './SessionSummary.module.css'

interface SessionSummaryProps {
  summary: SessionSummaryData
  onDone: () => void
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${remainingSeconds}s`
}

export function SessionSummary({ summary, onDone }: SessionSummaryProps) {
  const accuracy = summary.totalReviewed > 0
    ? Math.round((summary.correctCount / summary.totalReviewed) * 100)
    : 0

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

      <button className={styles.button} onClick={onDone}>
        Done
      </button>
    </div>
  )
}
