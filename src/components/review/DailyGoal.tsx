import { useQueueStats } from '@/hooks/useQueueStats'
import { useTranslation } from '@/i18n'
import styles from './DailyGoal.module.css'

function streakIcon(streak: number): string {
  if (streak >= 100) return '👑'
  if (streak >= 30) return '🔥🔥'
  if (streak >= 7) return '🔥🔥'
  return '🔥'
}

export function DailyGoal({ onReview }: { onReview?: () => void }) {
  const { dueCount, newToday, newLimit, currentStreak, activatedToday } = useQueueStats()
  const { t } = useTranslation()

  const newPct = newLimit > 0 ? Math.min(100, (newToday / newLimit) * 100) : 0
  const reviewsDone = dueCount === 0 && activatedToday

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>{t('dailyGoal.heading')}</h3>

      <div className={styles.row}>
        <span className={styles.label}>{t('dailyGoal.newKanji')}</span>
        <div className={styles.barTrack}>
          <div
            className={styles.barFill}
            style={{ width: `${newPct}%` }}
            data-complete={newToday >= newLimit ? '' : undefined}
          />
        </div>
        <span className={styles.count}>
          {newToday}/{newLimit}
          {newToday >= newLimit && ' ✅'}
        </span>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>{t('dailyGoal.reviews')}</span>
        <div className={styles.barTrack}>
          <div
            className={`${styles.barFill} ${styles.barReview}`}
            style={{ width: reviewsDone ? '100%' : '0%' }}
          />
        </div>
        <span className={styles.count}>
          {reviewsDone ? t('dailyGoal.done') : dueCount > 0 ? t('dailyGoal.due', { count: dueCount }) : t('dailyGoal.noneDue')}
        </span>
      </div>

      {dueCount > 0 && onReview && (
        <button className={styles.reviewAction} onClick={onReview} type="button">
          {dueCount === 1 ? t('dailyGoal.reviewCards', { count: dueCount }) : t('dailyGoal.reviewCardsPlural', { count: dueCount })}
        </button>
      )}

      {(currentStreak > 0 || activatedToday) && (
        <div className={`${styles.streak} ${currentStreak >= 30 ? styles.streakGold : ''}`}>
          <span className={styles.streakIcon}>{streakIcon(currentStreak)}</span>
          <span className={styles.streakNum}>{currentStreak}</span>
          <span className={styles.streakLabel}>{t('dailyGoal.dayStreak')}</span>
        </div>
      )}
    </div>
  )
}
