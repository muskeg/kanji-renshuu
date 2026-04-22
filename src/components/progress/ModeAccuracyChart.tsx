import { useModeAccuracy } from '@/hooks/useModeAccuracy'
import type { QuizMode } from '@/core/srs/types'
import styles from './ModeAccuracyChart.module.css'

const MODE_LABELS: Record<QuizMode, string> = {
  recognition: 'Flashcards',
  meaning: 'Meaning',
  reading: 'Reading',
  writing: 'Writing',
  cloze: 'Cloze',
}

function classify(acc: number, reviews: number): string {
  if (reviews === 0) return styles.low
  if (acc < 0.6) return styles.low
  if (acc < 0.8) return styles.mid
  return styles.ok
}

export function ModeAccuracyChart() {
  const { data, loading } = useModeAccuracy(30)
  if (loading) return null
  return (
    <div className={styles.container} role="list" aria-label="Per-mode accuracy (last 30 days)">
      {data.map(row => {
        const pct = Math.round(row.accuracy * 100)
        return (
          <div key={row.mode} className={styles.row} role="listitem">
            <span className={styles.label}>{MODE_LABELS[row.mode]}</span>
            <div className={styles.track} aria-hidden="true">
              <div
                className={`${styles.fill} ${classify(row.accuracy, row.reviews)}`}
                style={{ width: `${row.reviews > 0 ? pct : 0}%` }}
              />
            </div>
            <span className={styles.value}>
              {row.reviews > 0 ? `${pct}%` : <span className={styles.empty}>—</span>}
            </span>
          </div>
        )
      })}
    </div>
  )
}
