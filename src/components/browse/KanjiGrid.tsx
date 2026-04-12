import { useMemo } from 'react'
import type { KanjiEntry } from '@/core/srs/types'
import type { CardSrsStatus } from '@/hooks/useCardStatus'
import { useTranslation } from '@/i18n'
import styles from './KanjiGrid.module.css'

interface KanjiGridProps {
  kanji: KanjiEntry[]
  onSelect: (kanji: KanjiEntry) => void
  statusMap?: Map<string, CardSrsStatus>
}

export function KanjiGrid({ kanji, onSelect, statusMap }: KanjiGridProps) {
  const { t } = useTranslation()
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
        <p>{t('browse.noMatch')}</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {statusMap && (
        <div className={styles.legend}>
          <span className={styles.legendItem}><span className={styles.legendDot} data-status="new" /> {t('browse.new')}</span>
          <span className={styles.legendItem}><span className={styles.legendDot} data-status="learning" /> {t('browse.learning')}</span>
          <span className={styles.legendItem}><span className={styles.legendDot} data-status="mature" /> {t('browse.mastered')}</span>
          <span className={styles.legendItem}><span className={styles.legendDot} data-status="overdue" /> {t('browse.overdue')}</span>
        </div>
      )}
      {grouped.map(([grade, entries]) => (
        <section key={grade} className={styles.section}>
          <h3 className={styles.gradeHeader}>
            {grade === 8 ? t('browse.secondaryJoyo') : t('browse.gradeHeader', { grade })}
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
                {statusMap && (
                  <span
                    className={styles.statusDot}
                    data-status={statusMap.get(k.literal) ?? 'new'}
                  />
                )}
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
