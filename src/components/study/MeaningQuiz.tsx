import { useState, useMemo, useCallback } from 'react'
import type { KanjiEntry, ReviewItem, RatingValue } from '@/core/srs/types'
import { selectDistractors } from '@/core/learning/quiz-modes'
import { useTranslation, getMeanings } from '@/i18n'
import styles from './MeaningQuiz.module.css'

/** Shuffle an array (called only during initial render via useMemo) */
function shuffle(arr: KanjiEntry[]): KanjiEntry[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

interface MeaningQuizProps {
  item: ReviewItem
  kanjiPool: KanjiEntry[]
  onRate: (rating: RatingValue) => void
}

type AnswerState = null | 'correct' | 'wrong'

export function MeaningQuiz({ item, kanjiPool, onRate }: MeaningQuizProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState>(null)
  const { t } = useTranslation()

  // Safe: shuffle runs only once per mount (key-based remount resets this)
  const options = useMemo(() => {
    const distractors = selectDistractors(item.kanji, kanjiPool, 3)
    return shuffle([item.kanji, ...distractors])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelect = useCallback(
    (literal: string) => {
      if (answerState !== null) return

      setSelected(literal)
      const isCorrect = literal === item.kanji.literal

      setAnswerState(isCorrect ? 'correct' : 'wrong')

      // Auto-advance after a brief delay
      setTimeout(() => {
        onRate(isCorrect ? 3 : 1)
        setSelected(null)
        setAnswerState(null)
      }, 800)
    },
    [answerState, item.kanji.literal, onRate],
  )

  return (
    <div className={styles.container}>
      <div className={styles.prompt}>
        <span className={styles.promptLabel}>{t('meaningQuiz.prompt')}</span>
        <span className={styles.meaning}>{getMeanings(item.kanji).join(', ')}</span>
      </div>

      <div className={styles.options}>
        {options.map(k => {
          let buttonClass = styles.option
          if (answerState !== null && k.literal === item.kanji.literal) {
            buttonClass += ` ${styles.correct}`
          } else if (answerState === 'wrong' && k.literal === selected) {
            buttonClass += ` ${styles.wrong}`
          }

          return (
            <button
              key={k.literal}
              className={buttonClass}
              onClick={() => handleSelect(k.literal)}
              disabled={answerState !== null}
              type="button"
            >
              {k.literal}
            </button>
          )
        })}
      </div>

      {answerState === 'wrong' && (
        <div className={styles.feedback}>
          {t('meaningQuiz.correctAnswer', { literal: item.kanji.literal })}
        </div>
      )}
    </div>
  )
}
