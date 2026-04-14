import { useState, useCallback } from 'react'
import type { ReviewItem, RatingValue } from '@/core/srs/types'
import { matchesReading, normalizeReading } from '@/utils/japanese'
import { romajiToKanaFinal } from '@/utils/romaji'
import { RomajiInput } from '@/components/ui/RomajiInput'
import { useTranslation, getMeanings } from '@/i18n'
import styles from './ReadingQuiz.module.css'

interface ReadingQuizProps {
  item: ReviewItem
  onRate: (rating: RatingValue) => void
}

type AnswerState = null | 'correct' | 'wrong'

export function ReadingQuiz({ item, onRate }: ReadingQuizProps) {
  const [kanaValue, setKanaValue] = useState('')
  const [rawValue, setRawValue] = useState('')
  const [answerState, setAnswerState] = useState<AnswerState>(null)
  const { t } = useTranslation()

  const handleInputChange = useCallback((kana: string, raw: string) => {
    setKanaValue(kana)
    setRawValue(raw)
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (answerState !== null || rawValue.trim().length === 0) return

      // Finalize conversion (flush trailing 'n' → ん)
      const finalKana = romajiToKanaFinal(rawValue)
      const isCorrect = matchesReading(finalKana, item.kanji)
      setAnswerState(isCorrect ? 'correct' : 'wrong')

      setTimeout(() => {
        onRate(isCorrect ? 3 : 1)
        setKanaValue('')
        setRawValue('')
        setAnswerState(null)
      }, 1200)
    },
    [answerState, rawValue, item.kanji, onRate],
  )

  const allReadings = [
    ...item.kanji.readings.onYomi,
    ...item.kanji.readings.kunYomi.map(r => normalizeReading(r)),
  ]

  return (
    <div className={styles.container}>
      <div className={styles.kanji}>{item.kanji.literal}</div>
      <div className={styles.hint}>{getMeanings(item.kanji).slice(0, 2).join(', ')}</div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <RomajiInput
          value={kanaValue}
          onChange={handleInputChange}
          className={
            answerState === 'correct'
              ? styles.inputCorrect
              : answerState === 'wrong'
                ? styles.inputWrong
                : ''
          }
          placeholder={t('readingQuiz.placeholder')}
          disabled={answerState !== null}
          ariaLabel={t('readingQuiz.inputLabel')}
          autoFocus
        />
        <button
          className={styles.submit}
          type="submit"
          disabled={answerState !== null || rawValue.trim().length === 0}
        >
          {t('readingQuiz.check')}
        </button>
      </form>

      {answerState === 'correct' && (
        <div className={styles.feedbackCorrect}>
          <span>{t('readingQuiz.correct')}</span>
          <span className={styles.otherReadings}>
            {t('readingQuiz.otherReadings')} {allReadings.join('、')}
          </span>
        </div>
      )}

      {answerState === 'wrong' && (
        <div className={styles.feedbackWrong}>
          <span>{t('readingQuiz.correctReadings')}</span>
          <span className={styles.correctAnswer}>{allReadings.join('、')}</span>
        </div>
      )}
    </div>
  )
}
