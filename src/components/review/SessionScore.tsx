import type { SessionScore } from '@/core/srs/scoring'
import { useTranslation } from '@/i18n'
import styles from './SessionScore.module.css'

interface SessionScoreProps {
  score: SessionScore
  isPersonalBest: boolean
  previousBest: number
}

export function SessionScoreCard({ score, isPersonalBest, previousBest }: SessionScoreProps) {
  const { t } = useTranslation()

  return (
    <div className={styles.container}>
      <div className={styles.total}>
        <span className={styles.totalLabel}>{t('score.sessionScore')}</span>
        <span className={styles.totalValue}>{score.total.toLocaleString()}</span>
        <span className={styles.totalUnit}>{t('score.pts')}</span>
      </div>

      <div className={styles.breakdown}>
        <div className={styles.row}>
          <span className={styles.rowLabel}>{t('score.base')}</span>
          <span className={styles.rowValue}>{score.base}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>{t('score.accuracyBonus')}</span>
          <span className={styles.rowValue}>+{score.accuracyBonus}</span>
        </div>
        {score.speedBonus > 0 && (
          <div className={styles.row}>
            <span className={styles.rowLabel}>{t('score.speedBonus')}</span>
            <span className={styles.rowValue}>+{score.speedBonus}</span>
          </div>
        )}
        {score.streakMultiplier > 1 && (
          <div className={styles.row}>
            <span className={styles.rowLabel}>{t('score.streakMultiplier')}</span>
            <span className={styles.rowValue}>×{score.streakMultiplier.toFixed(1)}</span>
          </div>
        )}
      </div>

      {isPersonalBest && (
        <div className={styles.personalBest}>
          {previousBest > 0 ? t('score.personalBestPrev', { prev: previousBest.toLocaleString() }) : t('score.personalBest')}
        </div>
      )}
    </div>
  )
}
