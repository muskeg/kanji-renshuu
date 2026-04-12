import { useState, useMemo } from 'react'
import type { SessionSummaryData } from '@/core/srs/types'
import { computeSessionScore, recordScore } from '@/core/srs/scoring'
import { useQueueStats } from '@/hooks/useQueueStats'
import { useCountdown } from '@/hooks/useCountdown'
import { useTranslation } from '@/i18n'
import { SessionScoreCard } from './SessionScore'
import styles from './SessionSummary.module.css'

interface SessionSummaryProps {
  summary: SessionSummaryData
  onDone: () => void
  onRetryStruggled?: (() => void) | null
  onNewSession?: () => void
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${remainingSeconds}s`
}

export function SessionSummary({ summary, onDone, onRetryStruggled, onNewSession }: SessionSummaryProps) {
  const [showStruggled, setShowStruggled] = useState(false)
  const { currentStreak, dueCount, newToday, newLimit, nextDueDate } = useQueueStats()
  const countdown = useCountdown(nextDueDate)
  const { t } = useTranslation()
  const accuracy = summary.totalReviewed > 0
    ? Math.round((summary.correctCount / summary.totalReviewed) * 100)
    : 0

  const scoreData = useMemo(() => {
    const score = computeSessionScore(summary, currentStreak)
    const record = recordScore(score.total)
    return { score, ...record }
  }, [summary, currentStreak])

  const struggled = summary.reviewedCards.filter(c => c.rating <= 2)
  const queueEmpty = dueCount === 0

  return (
    <div className={styles.container}>
      <div className={styles.checkmark}>
        <span className={styles.checkmarkIcon}>✓</span>
      </div>
      <h2 className={styles.title}>{t('summary.title')}</h2>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={`${styles.statValue} ${accuracy >= 80 ? styles.accuracy : styles.accuracyLow}`}>
            {accuracy}%
          </div>
          <div className={styles.statLabel}>{t('summary.accuracy')}</div>
        </div>

        <div className={styles.stat}>
          <div className={styles.statValue}>{summary.totalReviewed}</div>
          <div className={styles.statLabel}>{t('summary.cardsReviewed')}</div>
        </div>

        <div className={styles.stat}>
          <div className={styles.statValue}>{summary.newCardsIntroduced}</div>
          <div className={styles.statLabel}>{t('summary.newCards')}</div>
        </div>

        <div className={styles.stat}>
          <div className={styles.statValue}>{formatTime(summary.totalTimeMs)}</div>
          <div className={styles.statLabel}>{t('summary.timeSpent')}</div>
        </div>
      </div>

      <div className={styles.breakdown}>
        <div className={styles.breakdownItem}>
          <span className={`${styles.dot} ${styles.dotAgain}`} />
          {t('summary.again', { count: summary.againCount })}
        </div>
        <div className={styles.breakdownItem}>
          <span className={`${styles.dot} ${styles.dotHard}`} />
          {t('summary.hard', { count: summary.hardCount })}
        </div>
        <div className={styles.breakdownItem}>
          <span className={`${styles.dot} ${styles.dotGood}`} />
          {t('summary.good', { count: summary.goodCount })}
        </div>
        <div className={styles.breakdownItem}>
          <span className={`${styles.dot} ${styles.dotEasy}`} />
          {t('summary.easy', { count: summary.easyCount })}
        </div>
      </div>

      <SessionScoreCard
        score={scoreData.score}
        isPersonalBest={scoreData.isPersonalBest}
        previousBest={scoreData.previousBest}
      />

      {/* Daily progress update */}
      <div className={styles.dailyProgress}>
        <span>{t('summary.todayNew', { newToday, newLimit })}</span>
        <span className={styles.dailySep}>·</span>
        <span>{dueCount > 0 ? t('summary.reviewsLeft', { count: dueCount }) : t('summary.reviewsDone')}</span>
      </div>

      {/* Struggled cards section */}
      {struggled.length > 0 ? (
        <div className={styles.struggled}>
          <button
            className={styles.toggleButton}
            onClick={() => setShowStruggled(s => !s)}
            type="button"
          >
            {showStruggled ? '▾' : '▸'} {t('summary.struggledCards', { count: struggled.length })}
          </button>
          {showStruggled && (
            <div className={styles.struggledList}>
              {struggled.map(card => (
                <div key={card.kanjiLiteral} className={styles.struggledCard}>
                  <span className={styles.struggledKanji}>{card.kanjiLiteral}</span>
                  <span className={styles.struggledReading}>
                    {card.readings.onYomi[0] ?? card.readings.kunYomi[0] ?? ''}
                  </span>
                  <span className={styles.struggledMeaning}>
                    {card.meanings[0] ?? ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className={styles.perfect}>{t('summary.perfectSession')}</p>
      )}

      <div className={styles.actions}>
        {onRetryStruggled && (
          <button className={styles.buttonSecondary} onClick={onRetryStruggled}>
            {t('summary.reviewStruggled')}
          </button>
        )}
        {!queueEmpty && onNewSession && (
          <button className={styles.button} onClick={onNewSession}>
            {t('summary.startNewSession')}
          </button>
        )}
        {queueEmpty && countdown && (
          <p className={styles.ctaMessage}>
            {t('summary.allDone', { countdown })}
          </p>
        )}
        <button className={queueEmpty ? styles.button : styles.buttonSecondary} onClick={onDone}>
          {queueEmpty ? t('summary.done') : t('summary.backToHome')}
        </button>
      </div>
    </div>
  )
}
