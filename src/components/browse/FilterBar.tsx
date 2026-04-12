import { useTranslation } from '@/i18n'
import styles from './FilterBar.module.css'

export interface KanjiFilter {
  grades: number[]
  jlptLevels: number[]
  status: ('new' | 'learning' | 'review')[]
}

interface FilterBarProps {
  filter: KanjiFilter
  onChange: (filter: KanjiFilter) => void
}

const GRADES = [1, 2, 3, 4, 5, 6, 8]
const JLPT_LEVELS = [5, 4, 3, 2, 1]

function toggleInArray<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
}

export function FilterBar({ filter, onChange }: FilterBarProps) {
  const { t } = useTranslation()

  const STATUS_LABELS: Record<string, string> = {
    new: t('browse.new'),
    learning: t('browse.learning'),
    review: t('browse.review'),
  }

  return (
    <div className={styles.container}>
      <div className={styles.group}>
        <span className={styles.label}>{t('browse.grade')}</span>
        <div className={styles.chips}>
          {GRADES.map(g => (
            <button
              key={g}
              className={`${styles.chip} ${filter.grades.includes(g) ? styles.chipActive : ''}`}
              onClick={() => onChange({ ...filter, grades: toggleInArray(filter.grades, g) })}
              type="button"
            >
              {g === 8 ? 'S' : g}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.label}>{t('browse.jlpt')}</span>
        <div className={styles.chips}>
          {JLPT_LEVELS.map(n => (
            <button
              key={n}
              className={`${styles.chip} ${filter.jlptLevels.includes(n) ? styles.chipActive : ''}`}
              onClick={() => onChange({ ...filter, jlptLevels: toggleInArray(filter.jlptLevels, n) })}
              type="button"
            >
              N{n}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.label}>{t('browse.status')}</span>
        <div className={styles.chips}>
          {(['new', 'learning', 'review'] as const).map(s => (
            <button
              key={s}
              className={`${styles.chip} ${filter.status.includes(s) ? styles.chipActive : ''}`}
              onClick={() => onChange({ ...filter, status: toggleInArray(filter.status, s) })}
              type="button"
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {(filter.grades.length > 0 || filter.jlptLevels.length > 0 || filter.status.length > 0) && (
        <button
          className={styles.clearAll}
          onClick={() => onChange({ grades: [], jlptLevels: [], status: [] })}
          type="button"
        >
          {t('browse.clearAll')}
        </button>
      )}
    </div>
  )
}
