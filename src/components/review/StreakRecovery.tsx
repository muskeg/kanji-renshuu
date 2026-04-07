import { useState } from 'react'
import { getBrokenStreak, dismissBrokenStreak } from '@/core/srs/streakFreeze'
import styles from './StreakRecovery.module.css'

export function StreakRecovery() {
  const [broken] = useState(() => getBrokenStreak())
  const [dismissed, setDismissed] = useState(false)

  if (!broken || dismissed) return null

  function handleDismiss() {
    dismissBrokenStreak()
    setDismissed(true)
  }

  return (
    <div className={styles.container}>
      <span className={styles.icon}>💪</span>
      <div className={styles.text}>
        <div className={styles.title}>
          Your {broken.streak}-day streak ended
        </div>
        <div className={styles.body}>
          Start a new one today!
        </div>
      </div>
      <button className={styles.dismiss} onClick={handleDismiss} type="button">
        ✕
      </button>
    </div>
  )
}
