import { useQueueStats } from '@/hooks/useQueueStats'
import { useTranslation } from '@/i18n'
import { StreakChip } from './StreakChip'
import styles from './StatusBar.module.css'

export function StatusBar() {
  const { dueCount, newToday, newLimit, currentStreak, activatedToday, freezesAvailable } = useQueueStats()
  const { t } = useTranslation()

  return (
    <div className={styles.statusBar}>
      <span className={styles.stat}>
        📋 <span className={dueCount > 0 ? styles.valueDue : styles.value}>{dueCount}</span> {t('status.due')}
      </span>
      <span className={styles.divider}>·</span>
      <span className={styles.stat}>
        🆕 <span className={styles.value}>{newToday}/{newLimit}</span> {t('status.newToday')}
      </span>
      <span className={styles.divider}>·</span>
      <span className={styles.stat}>
        <StreakChip
          streak={currentStreak}
          freezes={freezesAvailable}
          activatedToday={activatedToday}
        />
      </span>
    </div>
  )
}
