import { useEffect, useMemo, useState, useCallback } from 'react'
import type { KanjiEntry, ReviewItem, RatingValue, VocabExample } from '@/core/srs/types'
import { selectDistractors } from '@/core/learning/quiz-modes'
import { getVocabFor } from '@/data/vocab-loader'
import { useTranslation } from '@/i18n'
import { SpeakerButton } from '@/components/ui/SpeakerButton'
import styles from './ClozeQuiz.module.css'

interface ClozeQuizProps {
  item: ReviewItem
  kanjiPool: KanjiEntry[]
  onRate: (rating: RatingValue) => void
}

type AnswerState = null | 'correct' | 'wrong'

const BLANK = '◯'

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Replace the first occurrence of `target` in `word` with the BLANK character.
 * If the kanji appears multiple times we still only blank the first to keep
 * the puzzle unambiguous.
 */
function blankWord(word: string, target: string): string {
  const idx = word.indexOf(target)
  if (idx < 0) return word
  return word.slice(0, idx) + BLANK + word.slice(idx + target.length)
}

export function ClozeQuiz({ item, kanjiPool, onRate }: ClozeQuizProps) {
  const { t } = useTranslation()
  const [example, setExample] = useState<VocabExample | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState>(null)

  // Load a random example word containing this kanji.
  useEffect(() => {
    let cancelled = false
    getVocabFor(item.kanji.literal, item.kanji.grade).then(list => {
      if (cancelled) return
      if (list.length === 0) {
        // No example available — auto-rate as Good (3) so review still progresses.
        // The session will just skip this card visually.
        onRate(3)
        return
      }
      // Prefer common/short words for cleaner puzzles.
      const ranked = [...list].sort((a, b) => {
        const ac = a.c === 1 ? 1 : 0
        const bc = b.c === 1 ? 1 : 0
        if (ac !== bc) return bc - ac
        return a.w.length - b.w.length
      })
      // Random pick from top 3 to add variety.
      const pool = ranked.slice(0, 3)
      setExample(pool[Math.floor(Math.random() * pool.length)])
    })
    return () => { cancelled = true }
  }, [item.kanji.literal, item.kanji.grade, onRate])

  const options = useMemo(() => {
    const distractors = selectDistractors(item.kanji, kanjiPool, 3)
    return shuffle([item.kanji, ...distractors])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelect = useCallback((literal: string) => {
    if (answerState !== null) return
    setSelected(literal)
    const isCorrect = literal === item.kanji.literal
    setAnswerState(isCorrect ? 'correct' : 'wrong')
    window.setTimeout(() => {
      onRate(isCorrect ? 3 : 1)
      setSelected(null)
      setAnswerState(null)
    }, 1000)
  }, [answerState, item.kanji.literal, onRate])

  if (!example) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>…</div>
      </div>
    )
  }

  const blanked = blankWord(example.w, item.kanji.literal)

  return (
    <div className={styles.container}>
      <div className={styles.prompt}>
        <span className={styles.promptLabel}>{t('clozeQuiz.prompt')}</span>
        <div className={styles.wordRow}>
          <span className={styles.word} aria-label={t('clozeQuiz.fillBlank')}>
            {[...blanked].map((ch, i) => (
              <span
                key={i}
                className={ch === BLANK ? styles.blank : styles.char}
              >
                {ch}
              </span>
            ))}
          </span>
        </div>
        <div className={styles.reading}>{example.r}</div>
        <div className={styles.meaning}>{example.m}</div>
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

      {answerState !== null && (
        <div className={styles.feedbackRow}>
          <span className={styles.feedbackWord}>{example.w}</span>
          <SpeakerButton text={example.w} />
        </div>
      )}
    </div>
  )
}
