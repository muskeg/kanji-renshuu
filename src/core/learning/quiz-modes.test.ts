import { describe, it, expect } from 'vitest'
import { selectDistractors, selectReadingDistractors } from '@/core/learning/quiz-modes'
import type { KanjiEntry } from '@/core/srs/types'

function makeKanji(literal: string, grade: number): KanjiEntry {
  return {
    literal,
    grade,
    jlpt: null,
    strokeCount: 4,
    frequency: null,
    radical: 1,
    readings: {
      onYomi: [`${literal}オン`],
      kunYomi: [`${literal}くん`],
      nanori: [],
    },
    meanings: [`meaning of ${literal}`],
    meaningsFr: [],
    strokeOrderSvg: '',
    components: [],
  }
}

describe('selectDistractors', () => {
  const pool = [
    makeKanji('日', 1),
    makeKanji('月', 1),
    makeKanji('火', 1),
    makeKanji('水', 1),
    makeKanji('木', 1),
    makeKanji('金', 2),
    makeKanji('土', 2),
  ]

  it('returns the requested number of distractors', () => {
    const result = selectDistractors(pool[0], pool, 3)
    expect(result).toHaveLength(3)
  })

  it('excludes the correct answer', () => {
    const result = selectDistractors(pool[0], pool, 3)
    expect(result.every(k => k.literal !== '日')).toBe(true)
  })

  it('prefers same grade', () => {
    const result = selectDistractors(pool[0], pool, 3)
    // All grade-1 kanji (excluding 日) = 月火水木 = 4 candidates
    // Should pick 3 from grade-1 before going to grade-2
    expect(result.every(k => k.grade === 1)).toBe(true)
  })

  it('falls back to other grades if same grade pool is insufficient', () => {
    const smallPool = [
      makeKanji('日', 1),
      makeKanji('月', 1),
      makeKanji('金', 2),
      makeKanji('土', 2),
    ]
    const result = selectDistractors(smallPool[0], smallPool, 3)
    expect(result).toHaveLength(3)
  })

  it('returns fewer if pool is too small', () => {
    const tinyPool = [makeKanji('日', 1), makeKanji('月', 1)]
    const result = selectDistractors(tinyPool[0], tinyPool, 3)
    expect(result).toHaveLength(1)
  })
})

describe('selectReadingDistractors', () => {
  const pool = [
    makeKanji('日', 1),
    makeKanji('月', 1),
    makeKanji('火', 1),
    makeKanji('水', 1),
  ]

  it('returns the requested number of reading distractors', () => {
    const result = selectReadingDistractors(pool[0], pool, 3)
    expect(result).toHaveLength(3)
  })

  it('excludes readings that belong to the correct kanji', () => {
    const result = selectReadingDistractors(pool[0], pool, 3)
    expect(result.every(r => r !== '日オン' && r !== '日くん')).toBe(true)
  })
})
