import { useState } from 'react'
import { useTranslation } from '@/i18n'
import styles from './RatingTooltip.module.css'

const TOOLTIP_SHOWN_KEY = 'kanji-renshuu-rating-tooltip-shown'

export function RatingTooltip() {
  const [visible, setVisible] = useState(
    () => !localStorage.getItem(TOOLTIP_SHOWN_KEY),
  )
  const { t } = useTranslation()

  if (!visible) return null

  function dismiss() {
    localStorage.setItem(TOOLTIP_SHOWN_KEY, '1')
    setVisible(false)
  }

  return (
    <div className={styles.overlay} onClick={dismiss}>
      <div className={styles.card} onClick={e => e.stopPropagation()}>
        <h3 className={styles.title}>{t('ratingTooltip.title')}</h3>
        <dl className={styles.list}>
          <div className={styles.item}>
            <dt className={styles.rating} data-color="again">{t('rating.again')}</dt>
            <dd className={styles.desc}>{t('ratingTooltip.again')}</dd>
          </div>
          <div className={styles.item}>
            <dt className={styles.rating} data-color="hard">{t('rating.hard')}</dt>
            <dd className={styles.desc}>{t('ratingTooltip.hard')}</dd>
          </div>
          <div className={styles.item}>
            <dt className={styles.rating} data-color="good">{t('rating.good')}</dt>
            <dd className={styles.desc}>{t('ratingTooltip.good')}</dd>
          </div>
          <div className={styles.item}>
            <dt className={styles.rating} data-color="easy">{t('rating.easy')}</dt>
            <dd className={styles.desc}>{t('ratingTooltip.easy')}</dd>
          </div>
        </dl>
        <p className={styles.hint}>
          {t('ratingTooltip.hint')}
        </p>
        <button className={styles.button} onClick={dismiss}>{t('ratingTooltip.gotIt')}</button>
      </div>
    </div>
  )
}
