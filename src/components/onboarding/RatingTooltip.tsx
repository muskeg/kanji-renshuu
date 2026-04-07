import { useState } from 'react'
import styles from './RatingTooltip.module.css'

const TOOLTIP_SHOWN_KEY = 'kanji-renshuu-rating-tooltip-shown'

export function RatingTooltip() {
  const [visible, setVisible] = useState(
    () => !localStorage.getItem(TOOLTIP_SHOWN_KEY),
  )

  if (!visible) return null

  function dismiss() {
    localStorage.setItem(TOOLTIP_SHOWN_KEY, '1')
    setVisible(false)
  }

  return (
    <div className={styles.overlay} onClick={dismiss}>
      <div className={styles.card} onClick={e => e.stopPropagation()}>
        <h3 className={styles.title}>Rate how well you remembered</h3>
        <dl className={styles.list}>
          <div className={styles.item}>
            <dt className={styles.rating} data-color="again">Again</dt>
            <dd className={styles.desc}>Didn&apos;t know it at all</dd>
          </div>
          <div className={styles.item}>
            <dt className={styles.rating} data-color="hard">Hard</dt>
            <dd className={styles.desc}>Barely recalled after struggling</dd>
          </div>
          <div className={styles.item}>
            <dt className={styles.rating} data-color="good">Good</dt>
            <dd className={styles.desc}>Remembered after a moment of thought</dd>
          </div>
          <div className={styles.item}>
            <dt className={styles.rating} data-color="easy">Easy</dt>
            <dd className={styles.desc}>Knew it instantly</dd>
          </div>
        </dl>
        <p className={styles.hint}>
          The time below each button shows when you&apos;ll see this card again.
        </p>
        <button className={styles.button} onClick={dismiss}>Got it</button>
      </div>
    </div>
  )
}
