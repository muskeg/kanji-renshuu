import styles from './LevelProgress.module.css'

interface LevelProgressProps {
  gradeProgress: { grade: number; total: number; introduced: number }[]
  jlptProgress: { level: number; total: number; introduced: number }[]
}

function gradeLabel(grade: number): string {
  return grade === 8 ? 'Secondary' : `Grade ${grade}`
}

export function LevelProgress({ gradeProgress, jlptProgress }: LevelProgressProps) {
  return (
    <div className={styles.container}>
      <section>
        <h3 className={styles.sectionTitle}>By Grade</h3>
        <div className={styles.items}>
          {gradeProgress.map(({ grade, total, introduced }) => (
            <div key={grade} className={styles.item}>
              <span className={styles.label}>{gradeLabel(grade)}</span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: total > 0 ? `${(introduced / total) * 100}%` : '0%' }}
                />
              </div>
              <span className={styles.fraction}>{introduced} / {total}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className={styles.sectionTitle}>By JLPT Level</h3>
        <div className={styles.items}>
          {jlptProgress.map(({ level, total, introduced }) => (
            <div key={level} className={styles.item}>
              <span className={styles.label}>N{level}</span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: total > 0 ? `${(introduced / total) * 100}%` : '0%' }}
                />
              </div>
              <span className={styles.fraction}>{introduced} / {total}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
