import { useMemo } from 'react'
import type { KanjiEntry } from '@/core/srs/types'
import styles from './KanjiGrid.module.css'

interface KanjiGridProps {
  kanji: KanjiEntry[]
  onSelect: (kanji: KanjiEntry) => void
}

export function KanjiGrid({ kanji, onSelect }: KanjiGridProps) {
  const grouped = useMemo(() => {
    const groups = new Map<number, KanjiEntry[]>()
    for (const k of kanji) {
      const list = groups.get(k.grade) ?? []
      list.push(k)
      groups.set(k.grade, list)
    }
    return [...groups.entries()].sort(([a], [b]) => a - b)
  }, [kanji])

  if (kanji.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No kanji match your filters.</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {grouped.map(([grade, entries]) => (
        <section key={grade} className={styles.section}>
          <h3 className={styles.gradeHeader}>
            {grade === 8 ? 'Secondary (Jōyō)' : `Grade ${grade}`}
            <span className={styles.count}>{entries.length}</span>
          </h3>
          <div className={styles.grid}>
            {entries.map(k => (
              <button
                key={k.literal}
                className={styles.tile}
                onClick={() => onSelect(k)}
                title={k.meanings[0]}
                type="button"
              >
                <span className={styles.literal}>{k.literal}</span>
                <span className={styles.meaning}>{k.meanings[0]}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
