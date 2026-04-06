import type { KanjiEntry } from '@/core/srs/types'
import { useQuizSession } from '@/hooks/useQuizSession'
import { ReadingQuiz } from './ReadingQuiz'
import { SessionSummary } from '@/components/review/SessionSummary'
import styles from './QuizSession.module.css'

interface ReadingQuizSessionProps {
  kanjiData: KanjiEntry[]
}

export function ReadingQuizSession({ kanjiData }: ReadingQuizSessionProps) {
  const {
    phase,
    currentItem,
    currentIndex,
    totalCards,
    summary,
    startSession,
    rateCard,
    endSession,
  } = useQuizSession(kanjiData, 'reading')

  if (phase === 'summary' && summary) {
    return <SessionSummary summary={summary} onDone={endSession} />
  }

  if (phase === 'idle' || !currentItem) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>読</div>
        <h2 className={styles.emptyTitle}>Reading Quiz</h2>
        <p className={styles.emptyText}>
          See a kanji and type its reading in hiragana or katakana.
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

      <ReadingQuiz item={currentItem} onRate={rateCard} />
    </div>
  )
}
