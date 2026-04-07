import type { QueueStatus } from '@/core/srs/types'
import { formatRelativeTime } from '@/utils/time'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  status: QueueStatus
  onStart: () => void
}

export function EmptyState({ status, onStart }: EmptyStateProps) {
  const { reason, nextDueDate, newCardsToday, newCardsLimit, totalIntroduced, totalKanji } = status

  switch (reason) {
    case 'no-cards':
      return (
        <div className={styles.container}>
          <div className={styles.icon}>📚</div>
          <h2 className={styles.title}>Welcome!</h2>
          <p className={styles.body}>Start your kanji journey with your first review session.</p>
          <button className={styles.action} onClick={onStart}>
            Begin Learning
          </button>
        </div>
      )

    case 'daily-limit':
      return (
        <div className={styles.container}>
          <div className={styles.icon}>✅</div>
          <h2 className={styles.title}>All caught up!</h2>
          <p className={styles.body}>
            You've studied {newCardsToday}/{newCardsLimit} new cards today.
            {nextDueDate && (
              <>
                <br />
                Next review in {formatRelativeTime(nextDueDate)}.
              </>
            )}
          </p>
        </div>
      )

    case 'all-scheduled':
      return (
        <div className={styles.container}>
          <div className={styles.icon}>⏳</div>
          <h2 className={styles.title}>
            {nextDueDate ? `Next review in ${formatRelativeTime(nextDueDate)}` : 'All cards scheduled'}
          </h2>
          <p className={styles.body}>
            {totalIntroduced} card{totalIntroduced === 1 ? '' : 's'} scheduled. Check back soon.
          </p>
        </div>
      )

    case 'all-mastered':
      return (
        <div className={styles.container}>
          <div className={styles.icon}>🎉</div>
          <h2 className={styles.title}>Incredible!</h2>
          <p className={styles.body}>
            All {totalKanji.toLocaleString()} kanji reviewed.
            {nextDueDate && (
              <>
                <br />
                Next due {formatRelativeTime(nextDueDate)}.
              </>
            )}
          </p>
        </div>
      )

    case 'has-cards':
      return (
        <div className={styles.container}>
          <div className={styles.icon}>漢</div>
          <h2 className={styles.title}>Ready to Study</h2>
          <p className={styles.body}>
            {status.items.length} card{status.items.length === 1 ? '' : 's'} waiting for you.
          </p>
          <button className={styles.action} onClick={onStart}>
            Start Review
          </button>
        </div>
      )
  }
}
