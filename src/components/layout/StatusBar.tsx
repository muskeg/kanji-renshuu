import { useQueueStats } from '@/hooks/useQueueStats'
import styles from './StatusBar.module.css'

export function StatusBar() {
  const { dueCount, newToday, newLimit, currentStreak, activatedToday } = useQueueStats()

  return (
    <div className={styles.statusBar}>
      <span className={styles.stat}>
        📋 <span className={dueCount > 0 ? styles.valueDue : styles.value}>{dueCount}</span> due
      </span>
      <span className={styles.divider}>·</span>
      <span className={styles.stat}>
        🆕 <span className={styles.value}>{newToday}/{newLimit}</span> new today
      </span>
      <span className={styles.divider}>·</span>
      <span className={styles.stat}>
        {activatedToday ? '🔥' : ''} <span className={styles.streak}>{currentStreak}d</span> streak
      </span>
    </div>
  )
}
