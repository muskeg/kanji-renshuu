import { useState } from 'react'
import { useTranslation } from '@/i18n'
import styles from './SharedQueueBanner.module.css'

const DISMISSED_KEY = 'kanji-renshuu-shared-queue-banner-dismissed'

/**
 * One-time disclosure on the home page explaining that all study modes pull
 * from the same SRS queue. Dismissed permanently once the user closes it.
 */
export function SharedQueueBanner() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(() => !localStorage.getItem(DISMISSED_KEY))

  if (!visible) return null

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  return (
    <div className={styles.banner} role="note">
      <span className={styles.icon} aria-hidden>
        ℹ️
      </span>
      <p className={styles.text}>{t('home.sharedQueueBanner')}</p>
      <button
        type="button"
        className={styles.close}
        onClick={dismiss}
        aria-label={t('home.dismiss')}
      >
        ×
      </button>
    </div>
  )
}
