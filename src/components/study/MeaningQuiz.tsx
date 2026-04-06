import { useState, useMemo, useCallback } from 'react'
import type { KanjiEntry, ReviewItem, RatingValue } from '@/core/srs/types'
import { selectDistractors } from '@/core/learning/quiz-modes'
import styles from './MeaningQuiz.module.css'

interface MeaningQuizProps {
  item: ReviewItem
  kanjiPool: KanjiEntry[]
  onRate: (rating: RatingValue) => void
}

type AnswerState = null | 'correct' | 'wrong'

export function MeaningQuiz({ item, kanjiPool, onRate }: MeaningQuizProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState>(null)

  const options = useMemo(() => {
    const distractors = selectDistractors(item.kanji, kanjiPool, 3)
    const all = [item.kanji, ...distractors]
    // Fisher-Yates shuffle
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[all[i], all[j]] = [all[j], all[i]]
    }
    return all
  }, [item.kanji, kanjiPool])

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
        <span className={styles.promptLabel}>What kanji means:</span>
        <span className={styles.meaning}>{item.kanji.meanings.join(', ')}</span>
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
          The correct answer is <strong>{item.kanji.literal}</strong>
        </div>
      )}
    </div>
  )
}
