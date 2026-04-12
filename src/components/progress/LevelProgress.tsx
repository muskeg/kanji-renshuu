import { useTranslation } from '@/i18n'
import styles from './LevelProgress.module.css'

interface LevelProgressProps {
  gradeProgress: { grade: number; total: number; introduced: number }[]
  jlptProgress: { level: number; total: number; introduced: number }[]
}

export function LevelProgress({ gradeProgress, jlptProgress }: LevelProgressProps) {
  const { t } = useTranslation()

  function gradeLabel(grade: number): string {
    return grade === 8 ? t('grades.secondary') : t('grades.grade', { grade })
  }

  return (
    <div className={styles.container}>
      <section>
        <h3 className={styles.sectionTitle}>{t('levels.byGrade')}</h3>
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
        <h3 className={styles.sectionTitle}>{t('levels.byJlpt')}</h3>
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
