import type { SessionScore } from '@/core/srs/scoring'
import styles from './SessionScore.module.css'

interface SessionScoreProps {
  score: SessionScore
  isPersonalBest: boolean
  previousBest: number
}

export function SessionScoreCard({ score, isPersonalBest, previousBest }: SessionScoreProps) {
  return (
    <div className={styles.container}>
      <div className={styles.total}>
        <span className={styles.totalLabel}>Session Score</span>
        <span className={styles.totalValue}>{score.total.toLocaleString()}</span>
        <span className={styles.totalUnit}>pts</span>
      </div>

      <div className={styles.breakdown}>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Base</span>
          <span className={styles.rowValue}>{score.base}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Accuracy bonus</span>
          <span className={styles.rowValue}>+{score.accuracyBonus}</span>
        </div>
        {score.speedBonus > 0 && (
          <div className={styles.row}>
            <span className={styles.rowLabel}>Speed bonus</span>
            <span className={styles.rowValue}>+{score.speedBonus}</span>
          </div>
        )}
        {score.streakMultiplier > 1 && (
          <div className={styles.row}>
            <span className={styles.rowLabel}>Streak multiplier</span>
            <span className={styles.rowValue}>×{score.streakMultiplier.toFixed(1)}</span>
          </div>
        )}
      </div>

      {isPersonalBest && (
        <div className={styles.personalBest}>
          ⭐ New personal best!{previousBest > 0 && ` (was ${previousBest.toLocaleString()})`}
        </div>
      )}
    </div>
  )
}
