import type { KanjiEntry } from '@/core/srs/types'
import { useQuizSession } from '@/hooks/useQuizSession'
import { ClozeQuiz } from './ClozeQuiz'
import { SessionSummary } from '@/components/review/SessionSummary'
import { EmptyState } from '@/components/review/EmptyState'
import { useTranslation } from '@/i18n'
import styles from './QuizSession.module.css'

interface ClozeQuizSessionProps {
  kanjiData: KanjiEntry[]
}

export function ClozeQuizSession({ kanjiData }: ClozeQuizSessionProps) {
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
  } = useQuizSession(kanjiData, 'cloze')
  const { t } = useTranslation()

  if (phase === 'summary' && summary) {
    return <SessionSummary summary={summary} onDone={endSession} />
  }

  if (phase === 'idle' || !currentItem) {
    if (queueStatus) {
      return <EmptyState status={queueStatus} onStart={startSession} modeName={t('mode.clozeQuiz')} />
    }
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>◯</div>
        <h2 className={styles.emptyTitle}>{t('clozeQuiz.title')}</h2>
        <p className={styles.emptyText}>{t('clozeQuiz.desc')}</p>
        {kanjiData.length > 0 && (
          <button className={styles.startButton} onClick={startSession}>
            {t('clozeQuiz.startQuiz')}
          </button>
        )}
      </div>
    )
  }

  const progress = totalCards > 0 ? (currentIndex / totalCards) * 100 : 0

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
      <ClozeQuiz key={currentItem.kanji.literal} item={currentItem} kanjiPool={kanjiData} onRate={rateCard} />
    </div>
  )
}
