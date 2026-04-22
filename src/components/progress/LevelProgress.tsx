import { useTranslation } from '@/i18n'
import { useUserStats } from '@/hooks/useUserStats'
import {
  getLevel,
  getRankKey,
  levelProgress,
  xpForNextLevel,
} from '@/core/gamification/xp'
import styles from './LevelProgress.module.css'

interface LevelProgressProps {
  gradeProgress: { grade: number; total: number; introduced: number }[]
  jlptProgress: { level: number; total: number; introduced: number }[]
}

export function LevelProgress({ gradeProgress, jlptProgress }: LevelProgressProps) {
  const { t } = useTranslation()
  const { stats } = useUserStats()
  const xp = stats?.lifetimeXp ?? 0
  const level = getLevel(xp)
  const rank = getRankKey(level)
  const progressPct = Math.round(levelProgress(xp) * 100)
  const remaining = xpForNextLevel(xp)

  function gradeLabel(grade: number): string {
    return grade === 8 ? t('grades.secondary') : t('grades.grade', { grade })
  }

  return (
    <div className={styles.container}>
      <section className={styles.xpSection}>
        <div className={styles.xpHeader}>
          <span className={styles.xpLevel}>{t('xp.level', { level })}</span>
          <span className={styles.xpRank}>{t(rank)}</span>
        </div>
        <div className={styles.xpBarTrack}>
          <div className={styles.xpBarFill} style={{ width: `${progressPct}%` }} />
        </div>
        <div className={styles.xpFooter}>
          <span>{t('xp.lifetime', { xp })}</span>
          <span>{t('xp.toNext', { xp: remaining, level: level + 1 })}</span>
        </div>
      </section>

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
