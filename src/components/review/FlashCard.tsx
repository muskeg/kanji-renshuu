import type { KanjiEntry } from '@/core/srs/types'
import styles from './FlashCard.module.css'

interface FlashCardProps {
  kanji: KanjiEntry
  isFlipped: boolean
  onFlip: () => void
}

export function FlashCard({ kanji, isFlipped, onFlip }: FlashCardProps) {
  return (
    <div
      className={styles.card}
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onFlip()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={isFlipped ? `Kanji ${kanji.literal} details` : `Reveal kanji ${kanji.literal}`}
    >
      {!isFlipped ? (
        <>
          <div className={styles.kanji}>{kanji.literal}</div>
          <div className={styles.hint}>Tap to reveal</div>
        </>
      ) : (
        <div className={styles.back} aria-live="polite">
          <div className={styles.kanjiSmall}>{kanji.literal}</div>

          {kanji.readings.onYomi.length > 0 && (
            <div className={styles.readingsSection}>
              <span className={styles.readingLabel}>On&apos;yomi</span>
              <span className={styles.reading}>
                {kanji.readings.onYomi.join('、')}
              </span>
            </div>
          )}

          {kanji.readings.kunYomi.length > 0 && (
            <div className={styles.readingsSection}>
              <span className={styles.readingLabel}>Kun&apos;yomi</span>
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
              Grade {kanji.grade}
            </span>
            <span className={styles.metaTag}>
              {kanji.strokeCount} strokes
            </span>
            {kanji.jlpt && (
              <span className={styles.metaTag}>
                JLPT N{kanji.jlpt <= 2 ? kanji.jlpt : kanji.jlpt === 3 ? 4 : 5}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
