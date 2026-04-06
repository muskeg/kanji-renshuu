import { useState, useCallback, useRef, useEffect } from 'react'
import type { ReviewItem, RatingValue } from '@/core/srs/types'
import { matchesReading, normalizeReading } from '@/utils/japanese'
import styles from './ReadingQuiz.module.css'

interface ReadingQuizProps {
  item: ReviewItem
  onRate: (rating: RatingValue) => void
}

type AnswerState = null | 'correct' | 'wrong'

export function ReadingQuiz({ item, onRate }: ReadingQuizProps) {
  const [input, setInput] = useState('')
  const [answerState, setAnswerState] = useState<AnswerState>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on new card
  useEffect(() => {
    setInput('')
    setAnswerState(null)
    inputRef.current?.focus()
  }, [item.kanji.literal])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (answerState !== null || input.trim().length === 0) return

      const isCorrect = matchesReading(input, item.kanji)
      setAnswerState(isCorrect ? 'correct' : 'wrong')

      setTimeout(() => {
        onRate(isCorrect ? 3 : 1)
        setInput('')
        setAnswerState(null)
      }, 1200)
    },
    [answerState, input, item.kanji, onRate],
  )

  const allReadings = [
    ...item.kanji.readings.onYomi,
    ...item.kanji.readings.kunYomi.map(r => normalizeReading(r)),
  ]

  return (
    <div className={styles.container}>
      <div className={styles.kanji}>{item.kanji.literal}</div>
      <div className={styles.hint}>{item.kanji.meanings.slice(0, 2).join(', ')}</div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className={`${styles.input} ${
            answerState === 'correct'
              ? styles.inputCorrect
              : answerState === 'wrong'
                ? styles.inputWrong
                : ''
          }`}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type reading…"
          disabled={answerState !== null}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Type the reading for this kanji"
        />
        <button
          className={styles.submit}
          type="submit"
          disabled={answerState !== null || input.trim().length === 0}
        >
          Check
        </button>
      </form>

      {answerState === 'correct' && (
        <div className={styles.feedbackCorrect}>Correct!</div>
      )}

      {answerState === 'wrong' && (
        <div className={styles.feedbackWrong}>
          <span>Correct readings:</span>
          <span className={styles.correctAnswer}>{allReadings.join('、')}</span>
        </div>
      )}
    </div>
  )
}
