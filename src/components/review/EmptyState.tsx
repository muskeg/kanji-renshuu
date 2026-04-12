import type { QueueStatus } from '@/core/srs/types'
import { useCountdown } from '@/hooks/useCountdown'
import { useTranslation } from '@/i18n'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  status: QueueStatus
  onStart: () => void
  modeName?: string
}

export function EmptyState({ status, onStart, modeName }: EmptyStateProps) {
  const { reason, nextDueDate, newCardsToday, newCardsLimit, totalIntroduced, totalKanji } = status
  const countdown = useCountdown(nextDueDate)
  const { t } = useTranslation()

  // Common "start" button — always shown when there are cards to study
  if (reason === 'has-cards') {
    const reviewCount = status.items.filter(i => i.cardState.introduced).length
    const newCount = status.items.length - reviewCount
    const parts = [
      reviewCount > 0 ? (reviewCount === 1 ? t('empty.reviews', { count: reviewCount }) : t('empty.reviewsPlural', { count: reviewCount })) : '',
      newCount > 0 ? t('empty.new', { count: newCount }) : '',
    ].filter(Boolean).join(' + ')

    return (
      <div className={styles.container}>
        <div className={styles.icon}>漢</div>
        <h2 className={styles.title}>{modeName ?? t('empty.readyToStudy')}</h2>
        <p className={styles.body}>{t('empty.available', { parts })}</p>
        <button className={styles.action} onClick={onStart}>
          {modeName ? t('empty.startMode', { mode: modeName }) : t('empty.startSession')}
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
          <h2 className={styles.title}>{modeName ?? t('empty.noCardsYet')}</h2>
          <p className={styles.body}>
            {t('empty.noCardsBody')}
          </p>
        </div>
      )

    case 'daily-limit':
      return (
        <div className={styles.container}>
          <div className={styles.icon}>✅</div>
          <h2 className={styles.title}>{t('empty.dailyLimit')}</h2>
          <p className={styles.body}>
            {t('empty.dailyLimitBody', { newToday: newCardsToday, newLimit: newCardsLimit })}
            {countdown && (
              <>
                {' '}{t('empty.nextReviewIn', { countdown })}
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
            {countdown ? t('empty.nextReviewTitle', { countdown }) : t('empty.allScheduled')}
          </h2>
          <p className={styles.body}>
            {totalIntroduced === 1 ? t('empty.cardsInDeck', { count: totalIntroduced }) : t('empty.cardsInDeckPlural', { count: totalIntroduced })}
          </p>
        </div>
      )

    case 'all-mastered':
      return (
        <div className={styles.container}>
          <div className={styles.icon}>🎉</div>
          <h2 className={styles.title}>{t('empty.incredible')}</h2>
          <p className={styles.body}>
            {t('empty.allReviewed', { total: totalKanji.toLocaleString() })}
            {countdown && (
              <>
                {' '}{t('empty.nextDue', { countdown })}
              </>
            )}
          </p>
        </div>
      )
  }
}
