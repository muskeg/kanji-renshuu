import type { KanjiEntry } from '@/core/srs/types'
import { useQuizSession } from '@/hooks/useQuizSession'
import { MeaningQuiz } from './MeaningQuiz'
import { SessionSummary } from '@/components/review/SessionSummary'
import { EmptyState } from '@/components/review/EmptyState'
import styles from './QuizSession.module.css'

interface MeaningQuizSessionProps {
  kanjiData: KanjiEntry[]
}

export function MeaningQuizSession({ kanjiData }: MeaningQuizSessionProps) {
  const {
    phase,
    currentItem,
    currentIndex,
    totalCards,
    summary,
    queueStatus,
    startSession,
    rateCard,
    endSession,
  } = useQuizSession(kanjiData, 'meaning')

  if (phase === 'summary' && summary) {
    return <SessionSummary summary={summary} onDone={endSession} />
  }

  if (phase === 'idle' || !currentItem) {
    if (queueStatus) {
      return <EmptyState status={queueStatus} onStart={startSession} modeName="Meaning Quiz" />
    }

    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>意</div>
        <h2 className={styles.emptyTitle}>Meaning Quiz</h2>
        <p className={styles.emptyText}>
          See an English meaning and pick the matching kanji from 4 choices.
        </p>
        {kanjiData.length > 0 && (
          <button className={styles.startButton} onClick={startSession}>
            Start Quiz
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

      <MeaningQuiz key={currentItem.kanji.literal} item={currentItem} kanjiPool={kanjiData} onRate={rateCard} />
    </div>
  )
}
