import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { KanjiEntry, CardState } from '@/core/srs/types'

// Mock the db module before importing strategy
vi.mock('@/core/storage/db', () => ({
  getIntroducedCards: vi.fn(),
}))

import { getNewCardCandidates } from '@/core/learning/strategy'
import { getIntroducedCards } from '@/core/storage/db'

const mockedGetIntroduced = vi.mocked(getIntroducedCards)

function makeKanji(literal: string, grade: number, frequency: number | null = null): KanjiEntry {
  return {
    literal,
    grade,
    jlpt: null,
    strokeCount: 4,
    frequency,
    radical: 1,
    readings: { onYomi: [], kunYomi: [], nanori: [] },
    meanings: [`meaning of ${literal}`],
    meaningsFr: [],
    strokeOrderSvg: '',
    components: [],
  }
}

describe('getNewCardCandidates', () => {
  beforeEach(() => {
    mockedGetIntroduced.mockReset()
  })

  it('returns kanji sorted by grade then frequency', async () => {
    mockedGetIntroduced.mockResolvedValue([])
    const kanjiData = [
      makeKanji('金', 2, 100),
      makeKanji('日', 1, 1),
      makeKanji('月', 1, 2),
    ]

    const result = await getNewCardCandidates(kanjiData, 10)
    expect(result.map(k => k.literal)).toEqual(['日', '月', '金'])
  })

  it('respects the limit', async () => {
    mockedGetIntroduced.mockResolvedValue([])
    const kanjiData = [
      makeKanji('日', 1, 1),
      makeKanji('月', 1, 2),
      makeKanji('火', 1, 3),
    ]

    const result = await getNewCardCandidates(kanjiData, 2)
    expect(result).toHaveLength(2)
  })

  it('excludes already-introduced kanji', async () => {
    mockedGetIntroduced.mockResolvedValue([
      { kanjiLiteral: '日', introduced: true } as CardState,
    ])
    const kanjiData = [
      makeKanji('日', 1, 1),
      makeKanji('月', 1, 2),
    ]

    const result = await getNewCardCandidates(kanjiData, 10)
    expect(result.map(k => k.literal)).toEqual(['月'])
  })
})
