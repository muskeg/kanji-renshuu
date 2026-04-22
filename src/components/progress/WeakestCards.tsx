import type { KanjiEntry, DeckFilter } from '@/core/srs/types'
import { useWeakestCards } from '@/hooks/useWeakestCards'
import styles from './WeakestCards.module.css'

interface WeakestCardsProps {
  kanjiData: KanjiEntry[]
  /** Called with a DeckFilter that allow-lists the weakest literals so the
   *  caller can launch an ad-hoc review queue. */
  onDrill?: (filter: DeckFilter) => void
}

function classifyRetention(r: number): string {
  if (r < 0.6) return styles.low
  if (r < 0.8) return styles.mid
  return styles.ok
}

export function WeakestCards({ kanjiData, onDrill }: WeakestCardsProps) {
  const { cards, loading } = useWeakestCards(kanjiData, { limit: 20, days: 30, minReviews: 2 })

  const handleDrill = () => {
    if (cards.length === 0 || !onDrill) return
    onDrill({
      grades: [],
      jlptLevels: [],
      literals: cards.map(c => c.literal),
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.subtitle}>
          Bottom-20 by 30-day retention. At least 2 reviews required.
        </p>
        <button
          type="button"
          className={styles.drillButton}
          onClick={handleDrill}
          disabled={cards.length === 0}
        >
          Drill these →
        </button>
      </div>

      {loading ? null : cards.length === 0 ? (
        <div className={styles.empty}>
          No weak cards yet — review more kanji and check back here.
        </div>
      ) : (
        <div className={styles.list}>
          {cards.map(c => (
            <div key={c.literal} className={styles.card}>
              <span className={styles.literal}>{c.literal}</span>
              <span className={`${styles.retention} ${classifyRetention(c.retention)}`}>
                {Math.round(c.retention * 100)}%
              </span>
              <span className={styles.meta}>
                {c.correct}/{c.reviews} reviews
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
