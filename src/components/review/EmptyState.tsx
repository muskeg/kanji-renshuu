import type { QueueStatus } from '@/core/srs/types'
import { useCountdown } from '@/hooks/useCountdown'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  status: QueueStatus
  onStart: () => void
  modeName?: string
}

export function EmptyState({ status, onStart, modeName }: EmptyStateProps) {
  const { reason, nextDueDate, newCardsToday, newCardsLimit, totalIntroduced, totalKanji } = status
  const countdown = useCountdown(nextDueDate)

  switch (reason) {
    case 'no-cards':
      return (
        <div className={styles.container}>
          <div className={styles.icon}>📚</div>
          <h2 className={styles.title}>{modeName ?? 'No Cards Yet'}</h2>
          <p className={styles.body}>
            {modeName
              ? 'No cards available yet. Start a Flashcards session to introduce new kanji first.'
              : 'Start your kanji journey with your first review session.'}
          </p>
          {!modeName && (
            <button className={styles.action} onClick={onStart}>
              Begin Learning
            </button>
          )}
        </div>
      )

    case 'daily-limit':
      return (
        <div className={styles.container}>
          <div className={styles.icon}>✅</div>
          <h2 className={styles.title}>All caught up!</h2>
          <p className={styles.body}>
            You've studied {newCardsToday}/{newCardsLimit} new cards today.
            {countdown && (
              <>
                <br />
                Next review in {countdown}.
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
            {countdown ? `Next review in ${countdown}` : 'All cards scheduled'}
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
            {countdown && (
              <>
                <br />
                Next due {countdown}.
              </>
            )}
          </p>
        </div>
      )

    case 'has-cards': {
      const reviewCount = status.items.filter(i => i.cardState.introduced).length
      const newCount = status.items.length - reviewCount
      const description = [
        reviewCount > 0 ? `${reviewCount} review${reviewCount === 1 ? '' : 's'} due` : '',
        newCount > 0 ? `${newCount} new kanji to learn` : '',
      ].filter(Boolean).join(' · ')

      return (
        <div className={styles.container}>
          <div className={styles.icon}>漢</div>
          <h2 className={styles.title}>{modeName ?? 'Ready to Study'}</h2>
          <p className={styles.body}>{description}</p>
          <button className={styles.action} onClick={onStart}>
            {modeName ? `Start ${modeName}` : 'Start Session'}
          </button>
        </div>
      )
    }
  }
}
