import type { KanjiEntry } from '@/core/srs/types'
import { useTranslation } from '@/i18n'
import styles from './FlashCard.module.css'

interface FlashCardProps {
  kanji: KanjiEntry
  isFlipped: boolean
  onFlip: () => void
}

export function FlashCard({ kanji, isFlipped, onFlip }: FlashCardProps) {
  const { t } = useTranslation()

  return (
    <div
      className={styles.scene}
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onFlip()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={isFlipped ? t('review.kanjiDetails', { literal: kanji.literal }) : t('review.revealKanji', { literal: kanji.literal })}
    >
      <div className={`${styles.card} ${isFlipped ? styles.flipped : ''}`}>
        {/* Front face */}
        <div className={styles.face}>
          <div className={styles.kanji}>{kanji.literal}</div>
          <div className={styles.hint}>{t('review.tapToReveal')}</div>
        </div>

        {/* Back face */}
        <div className={`${styles.face} ${styles.faceBack}`} aria-live="polite">
          <div className={styles.kanjiSmall}>{kanji.literal}</div>

          {kanji.readings.onYomi.length > 0 && (
            <div className={styles.readingsSection}>
              <span className={styles.readingLabel}>{t('reading.onYomi')}</span>
              <span className={styles.reading}>
                {kanji.readings.onYomi.join('、')}
              </span>
            </div>
          )}

          {kanji.readings.kunYomi.length > 0 && (
            <div className={styles.readingsSection}>
              <span className={styles.readingLabel}>{t('reading.kunYomi')}</span>
              <span className={styles.reading}>
                {kanji.readings.kunYomi.join('、')}
              </span>
            </div>
          )}

          <div className={styles.meanings}>
            {kanji.meanings.join(', ')}
          </div>

          <div className={styles.meta}>
            <span className={styles.metaTag}>
              {t('meta.grade', { grade: kanji.grade })}
            </span>
            <span className={styles.metaTag}>
              {t('meta.strokes', { count: kanji.strokeCount })}
            </span>
            {kanji.jlpt && (
              <span className={styles.metaTag}>
                {t('meta.jlpt', { level: kanji.jlpt <= 2 ? kanji.jlpt : kanji.jlpt === 3 ? 4 : 5 })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
