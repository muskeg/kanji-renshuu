import { useTranslation } from '@/i18n'
import styles from './GradeJourney.module.css'

interface GradeData {
  grade: number
  total: number
  introduced: number
}

interface GradeJourneyProps {
  gradeProgress: GradeData[]
}

export function GradeJourney({ gradeProgress }: GradeJourneyProps) {
  const { t } = useTranslation()

  function gradeLabel(grade: number): string {
    return grade === 8 ? t('grades.secondary') : t('grades.grade', { grade })
  }

  function nodeStatus(g: GradeData) {
    if (g.introduced >= g.total && g.total > 0) return 'completed'
    if (g.introduced > 0) return 'current'
    // First grade with 0 introduced but all previous are complete → current
    return 'future'
  }

  // Determine statuses — first "future" grade after all completed should be "current"
  const statuses = gradeProgress.map(g => nodeStatus(g))
  const firstFuture = statuses.indexOf('future')
  const hasCurrent = statuses.includes('current')
  if (!hasCurrent && firstFuture >= 0) {
    statuses[firstFuture] = 'current'
  }

  const allComplete = statuses.every(s => s === 'completed')

  const circumference = Math.PI * 56 // 2πr where r ≈ 28 (half of 56px)

  return (
    <div className={styles.container}>
      <div className={styles.track}>
        {gradeProgress.map((g, i) => {
          const status = statuses[i]!
          const pct = g.total > 0 ? g.introduced / g.total : 0
          const offset = circumference * (1 - pct)
          const statusClass =
            status === 'completed' ? styles.nodeCompleted
              : status === 'current' ? styles.nodeCurrent
                : styles.nodeFuture

          return (
            <div key={g.grade} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && (
                <div className={`${styles.connector} ${status === 'completed' || (status === 'current' && statuses[i - 1] === 'completed') ? styles.connectorDone : ''}`} />
              )}
              <div className={`${styles.node} ${statusClass}`}>
                <div className={styles.circle}>
                  {status === 'completed' ? '✓' : g.grade === 8 ? 'S' : g.grade}
                  {status === 'current' && (
                    <svg className={styles.progressRing} viewBox="0 0 62 62">
                      <circle className={styles.ringBg} cx="31" cy="31" r="28" />
                      <circle
                        className={styles.ringFill}
                        cx="31" cy="31" r="28"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                      />
                    </svg>
                  )}
                </div>
                <span className={styles.label}>{gradeLabel(g.grade)}</span>
                <span className={styles.fraction}>
                  {g.introduced}/{g.total}
                </span>
                {status === 'current' && (
                  <span className={styles.marker}>{t('grades.youAreHere')}</span>
                )}
              </div>
            </div>
          )
        })}

        {/* Final master node */}
        <div className={`${styles.connector} ${allComplete ? styles.connectorDone : ''}`} />
        <div className={`${styles.node} ${styles.master} ${allComplete ? styles.nodeCompleted : styles.nodeFuture}`}>
          <div className={styles.circle}>🏆</div>
          <span className={styles.label}>{t('grades.joyoMaster')}</span>
        </div>
      </div>
    </div>
  )
}
