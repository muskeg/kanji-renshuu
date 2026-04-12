import type { KanjiEntry } from '@/core/srs/types'
import { useProgress } from '@/hooks/useProgress'
import { StreakCalendar } from './StreakCalendar'
import { ReviewForecast } from './ReviewForecast'
import { GradeJourney } from './GradeJourney'
import { LevelProgress } from './LevelProgress'
import { AchievementGallery } from './AchievementGallery'
import { useTranslation } from '@/i18n'
import styles from './Dashboard.module.css'

interface DashboardProps {
  kanjiData: KanjiEntry[]
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${remainingSeconds}s`
}

export function Dashboard({ kanjiData }: DashboardProps) {
  const progress = useProgress(kanjiData)
  const { t } = useTranslation()

  if (progress.loading) {
    return (
      <div className={styles.loading}>{t('progress.loading')}</div>
    )
  }

  const accuracy = progress.todayReviews > 0
    ? Math.round((progress.todayCorrect / progress.todayReviews) * 100)
    : 0

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>{t('progress.title')}</h2>

      {/* Today's Stats */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('progress.today')}</h3>
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{progress.todayReviews}</span>
            <span className={styles.statLabel}>{t('progress.reviews')}</span>
          </div>
          <div className={styles.statCard}>
            <span className={`${styles.statValue} ${accuracy >= 80 ? styles.good : accuracy > 0 ? styles.warn : ''}`}>
              {progress.todayReviews > 0 ? `${accuracy}%` : '—'}
            </span>
            <span className={styles.statLabel}>{t('progress.accuracy')}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{progress.todayNewCards}</span>
            <span className={styles.statLabel}>{t('progress.newCards')}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{formatTime(progress.todayTimeMs)}</span>
            <span className={styles.statLabel}>{t('progress.time')}</span>
          </div>
        </div>
      </section>

      {/* Upcoming Reviews Forecast */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('progress.upcomingReviews')}</h3>
        <ReviewForecast />
      </section>

      {/* Streak */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('progress.streakTitle')}</h3>
        <div className={styles.streakRow}>
          <div className={styles.streakMain}>
            <span className={styles.streakNumber}>{progress.currentStreak}</span>
            <span className={styles.streakUnit}>{t('progress.dayStreak')}</span>
          </div>
          <div className={styles.streakMeta}>
            <span className={styles.metaItem}>{t('progress.longest', { days: progress.longestStreak })}</span>
            <span className={styles.metaItem}>
              {progress.retentionRate > 0 ? t('progress.retention', { rate: Math.round(progress.retentionRate * 100) }) : '—'}
            </span>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('progress.overview')}</h3>
        <div className={styles.overviewRow}>
          <span className={styles.overviewItem}>
            <strong>{progress.introduced}</strong> {t('progress.introduced', { count: '' }).trim()}
          </span>
          <span className={styles.overviewDivider}>/</span>
          <span className={styles.overviewItem}>
            <strong>{progress.totalKanji}</strong> {t('progress.total', { count: '' }).trim()}
          </span>
          <span className={styles.overviewDivider}>·</span>
          <span className={styles.overviewItem}>
            <strong>{progress.notStarted}</strong> {t('progress.remaining', { count: '' }).trim()}
          </span>
        </div>
      </section>

      {/* Activity Heatmap */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('progress.activity')}</h3>
        <StreakCalendar dailyActivity={progress.dailyActivity} />
      </section>

      {/* Grade Journey */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('progress.gradeJourney')}</h3>
        <GradeJourney gradeProgress={progress.gradeProgress} />
      </section>

      {/* Level Progress */}
      <section className={styles.section}>
        <LevelProgress
          gradeProgress={progress.gradeProgress}
          jlptProgress={progress.jlptProgress}
        />
      </section>

      {/* Achievements */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('progress.achievements')}</h3>
        <AchievementGallery kanjiData={kanjiData} />
      </section>
    </div>
  )
}
