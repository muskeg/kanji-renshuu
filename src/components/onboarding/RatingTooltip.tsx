import { useState } from 'react'
import { useTranslation } from '@/i18n'
import styles from './RatingTooltip.module.css'

const TOOLTIP_SEEN_KEY = 'kanji-renshuu-rating-tooltip-seen'
/** Show the rating helper for the first N sessions, then auto-retire it. */
const TOOLTIP_MAX_SHOWS = 5

function readSeenCount(): number {
  const raw = localStorage.getItem(TOOLTIP_SEEN_KEY)
  if (!raw) return 0
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export function RatingTooltip() {
  const [visible, setVisible] = useState(() => readSeenCount() < TOOLTIP_MAX_SHOWS)
  const { t } = useTranslation()

  if (!visible) return null

  function dismiss() {
    const next = readSeenCount() + 1
    localStorage.setItem(TOOLTIP_SEEN_KEY, String(next))
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
