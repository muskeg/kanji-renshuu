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

  // Common "start" button — always shown when there are cards to study
  if (reason === 'has-cards') {
    const reviewCount = status.items.filter(i => i.cardState.introduced).length
    const newCount = status.items.length - reviewCount
    const parts = [
      reviewCount > 0 ? `${reviewCount} review${reviewCount === 1 ? '' : 's'}` : '',
      newCount > 0 ? `${newCount} new` : '',
    ].filter(Boolean).join(' + ')

    return (
      <div className={styles.container}>
        <div className={styles.icon}>漢</div>
        <h2 className={styles.title}>{modeName ?? 'Ready to Study'}</h2>
        <p className={styles.body}>{parts} available</p>
        <button className={styles.action} onClick={onStart}>
          Start {modeName ?? 'Session'}
        </button>
      </div>
    )
  }

  // All other reasons are "nothing to do right now" states
  switch (reason) {
    case 'no-cards':
      return (
        <div className={styles.container}>
          <div className={styles.icon}>📚</div>
          <h2 className={styles.title}>{modeName ?? 'No Cards Yet'}</h2>
          <p className={styles.body}>
            No cards to study yet. Start a Flashcards session from the Home page to introduce new kanji.
          </p>
        </div>
      )

    case 'daily-limit':
      return (
        <div className={styles.container}>
          <div className={styles.icon}>✅</div>
          <h2 className={styles.title}>Daily limit reached</h2>
          <p className={styles.body}>
            You've hit today's study limit ({newCardsToday}/{newCardsLimit} new cards).
            {countdown && (
              <>
                {' '}Next review in {countdown}.
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
            {totalIntroduced} card{totalIntroduced === 1 ? '' : 's'} in your deck. Come back later!
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
                {' '}Next due {countdown}.
              </>
            )}
          </p>
        </div>
      )
  }
}
