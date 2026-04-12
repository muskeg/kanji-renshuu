import { useState } from 'react'
import { getBrokenStreak, dismissBrokenStreak } from '@/core/srs/streakFreeze'
import { useTranslation } from '@/i18n'
import styles from './StreakRecovery.module.css'

export function StreakRecovery() {
  const [broken] = useState(() => getBrokenStreak())
  const [dismissed, setDismissed] = useState(false)
  const { t } = useTranslation()

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
          {t('streakRecovery.title', { count: broken.streak })}
        </div>
        <div className={styles.body}>
          {t('streakRecovery.body')}
        </div>
      </div>
      <button className={styles.dismiss} onClick={handleDismiss} type="button">
        ✕
      </button>
    </div>
  )
}
