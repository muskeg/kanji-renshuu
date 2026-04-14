import { useState, useCallback } from 'react'
import type { KanjiEntry } from '@/core/srs/types'
import { useQuizSession } from '@/hooks/useQuizSession'
import { WritingPractice } from './WritingPractice'
import { GuidedWriting } from './GuidedWriting'
import { SessionSummary } from '@/components/review/SessionSummary'
import { EmptyState } from '@/components/review/EmptyState'
import { loadSettings } from '@/core/storage/settings'
import { useTranslation } from '@/i18n'
import styles from './QuizSession.module.css'

interface WritingPracticeSessionProps {
  kanjiData: KanjiEntry[]
}

export function WritingPracticeSession({ kanjiData }: WritingPracticeSessionProps) {
  const [guidedMode, setGuidedMode] = useState(() => loadSettings().guidedWriting ?? true)
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
  } = useQuizSession(kanjiData, 'writing')
  const { t } = useTranslation()

  const toggleMode = useCallback(() => {
    setGuidedMode(prev => !prev)
  }, [])

  if (phase === 'summary' && summary) {
    return <SessionSummary summary={summary} onDone={endSession} />
  }

  if (phase === 'idle' || !currentItem) {
    if (queueStatus) {
      return <EmptyState status={queueStatus} onStart={startSession} modeName={t('mode.writingPractice')} />
    }

    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>書</div>
        <h2 className={styles.emptyTitle}>{t('writing.title')}</h2>
        <p className={styles.emptyText}>
          {t('writing.desc')}
        </p>
        {kanjiData.length > 0 && (
          <button className={styles.startButton} onClick={startSession}>
            {t('writing.startPractice')}
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

      {guidedMode && currentItem.kanji.strokeOrderSvg ? (
        <GuidedWriting
          key={`guided-${currentItem.kanji.literal}`}
          item={currentItem}
          onRate={rateCard}
          onToggleMode={toggleMode}
        />
      ) : (
        <WritingPractice
          key={`free-${currentItem.kanji.literal}`}
          item={currentItem}
          onRate={rateCard}
          onToggleMode={toggleMode}
          showModeToggle={!!currentItem.kanji.strokeOrderSvg}
        />
      )}
    </div>
  )
}
