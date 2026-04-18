import { useServiceWorker } from '@/hooks/useServiceWorker'
import { useTranslation } from '@/i18n'
import styles from './UpdatePrompt.module.css'

export function UpdatePrompt() {
  const { needRefresh, updateApp } = useServiceWorker()
  const { t } = useTranslation()

  if (!needRefresh) return null

  return (
    <div className={styles.updatePrompt} role="alert">
      <div className={styles.message}>
        <span className={styles.title}>{t('pwa.updateAvailable')}</span>
        <span className={styles.body}>{t('pwa.updateMessage')}</span>
      </div>
      <div className={styles.actions}>
        <button className={styles.reloadBtn} onClick={updateApp}>
          {t('pwa.reload')}
        </button>
      </div>
    </div>
  )
}
