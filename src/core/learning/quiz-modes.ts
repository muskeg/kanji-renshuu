import type { KanjiEntry, QuizMode } from '@/core/srs/types'
import { getLookalikes } from '@/data/lookalikes-loader'

/** All supported quiz mode definitions */
export const QUIZ_MODES: Record<
  QuizMode,
  { label: string; description: string }
> = {
  recognition: {
    label: 'Flashcards',
    description: 'See kanji, recall reading & meaning',
  },
  meaning: {
    label: 'Meaning Quiz',
    description: 'See English meaning, pick the kanji',
  },
  reading: {
    label: 'Reading Quiz',
    description: 'See kanji, type the reading',
  },
  writing: {
    label: 'Writing',
    description: 'Practice writing strokes',
  },
  cloze: {
    label: 'Cloze',
    description: 'Fill the missing kanji in a real word',
  },
}

/**
 * Select distractor kanji for multiple-choice quizzes.
 * Prefers visual look-alikes (same radical / shared component) when known,
 * then falls back to same grade, then any grade.
 */
export function selectDistractors(
  correct: KanjiEntry,
  pool: KanjiEntry[],
  count: number,
): KanjiEntry[] {
  // Filter out the correct answer
  const candidates = pool.filter(k => k.literal !== correct.literal)

  const lookalikeLiterals = new Set(getLookalikes(correct.literal, 8))
  const lookalikes = candidates.filter(k => lookalikeLiterals.has(k.literal))
  const sameGrade = candidates.filter(
    k => !lookalikeLiterals.has(k.literal) && k.grade === correct.grade,
  )
  const otherGrade = candidates.filter(
    k => !lookalikeLiterals.has(k.literal) && k.grade !== correct.grade,
  )

  const shuffled = [...shuffle(lookalikes), ...shuffle(sameGrade), ...shuffle(otherGrade)]
  return shuffled.slice(0, count)
}

/**
 * Select distractor readings for reading quiz multiple-choice.
 * Picks readings from other kanji in the same grade.
 */
export function selectReadingDistractors(
  correct: KanjiEntry,
  pool: KanjiEntry[],
  count: number,
): string[] {
  const correctReadings = new Set([
    ...correct.readings.onYomi,
    ...correct.readings.kunYomi,
  ])

  const candidates = pool
    .filter(k => k.literal !== correct.literal)
    .flatMap(k => [...k.readings.onYomi, ...k.readings.kunYomi])
    .filter(r => !correctReadings.has(r))

  return shuffle([...new Set(candidates)]).slice(0, count)
}

/** Fisher-Yates shuffle */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
