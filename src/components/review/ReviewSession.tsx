import type { KanjiEntry } from '@/core/srs/types'
import { useReviewSession } from '@/hooks/useReviewSession'
import { FlashCard } from './FlashCard'
import { RatingButtons } from './RatingButtons'
import { SessionSummary } from './SessionSummary'
import { EmptyState } from './EmptyState'
import { RatingTooltip } from '@/components/onboarding/RatingTooltip'
import { useTranslation } from '@/i18n'
import styles from './ReviewSession.module.css'

interface ReviewSessionProps {
  kanjiData: KanjiEntry[]
}

export function ReviewSession({ kanjiData }: ReviewSessionProps) {
  const {
    phase,
    currentItem,
    currentIndex,
    totalCards,
    isFlipped,
    summary,
    queueStatus,
    startSession,
    flipCard,
    rateCard,
    endSession,
    retryStruggled,
    startNewSession,
  } = useReviewSession(kanjiData)
  const { t } = useTranslation()

  if (phase === 'summary' && summary) {
    return (
      <SessionSummary
        summary={summary}
        onDone={endSession}
        onRetryStruggled={retryStruggled}
        onNewSession={startNewSession}
      />
    )
  }

  if (phase === 'idle' || !currentItem) {
    if (queueStatus) {
      return <EmptyState status={queueStatus} onStart={startSession} />
    }

    return (
      <div className={styles.empty}>
        <div className={styles.emptyKanji}>漢</div>
        <h2 className={styles.emptyTitle}>
          {kanjiData.length === 0 ? t('review.loading') : t('review.readyToStudy')}
        </h2>
        <p className={styles.emptyText}>
          {kanjiData.length === 0
            ? t('review.loadingData')
            : t('review.startPrompt')}
        </p>
        {kanjiData.length > 0 && (
          <button className={styles.startButton} onClick={startSession}>
            {t('review.startReview')}
          </button>
        )}
      </div>
    )
  }

  const progress = totalCards > 0 ? ((currentIndex) / totalCards) * 100 : 0

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span>{currentIndex + 1} / {totalCards}</span>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={currentIndex}
            aria-valuemin={0}
            aria-valuemax={totalCards}
          />
        </div>
      </div>

      <div className={styles.cardArea}>
        <FlashCard
          kanji={currentItem.kanji}
          isFlipped={isFlipped}
          onFlip={flipCard}
        />

        {isFlipped && (
          <>
            <RatingTooltip />
            <RatingButtons
              card={currentItem.cardState.fsrsCard}
              onRate={rateCard}
            />
          </>
        )}
      </div>
    </div>
  )
}
