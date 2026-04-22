import { describe, it, expect, beforeEach } from 'vitest'
import type { CardState, DailyStats, KanjiEntry } from '@/core/srs/types'
import {
  evaluateAchievements,
  getAchievementRules,
  loadUnlocks,
  type AchievementStats,
} from './achievements'

const TODAY = '2026-04-21'

function card(literal: string, opts: Partial<CardState> = {}): CardState {
  return {
    kanjiLiteral: literal,
    fsrsCard: { state: 0, due: new Date(), last_review: undefined } as never,
    lastReviewedAt: null,
    totalReviews: 0,
    correctReviews: 0,
    introduced: true,
    introducedAt: Date.now(),
    ...opts,
  }
}

function kanji(literal: string, grade: number): KanjiEntry {
  return {
    literal,
    grade,
    jlpt: null,
    frequency: null,
    strokeCount: 1,
    meanings: ['x'],
    readings: { onYomi: [], kunYomi: [] },
    components: [],
  } as KanjiEntry
}

function makeStats(overrides: Partial<AchievementStats>): AchievementStats {
  return {
    today: TODAY,
    cards: [],
    dailyStats: [],
    kanji: [],
    currentStreak: 0,
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('rule shape', () => {
  it('generates the expected number of rules across all families', () => {
    const rules = getAchievementRules()
    // 8 kanji thresholds + 6 grades + 5 streak thresholds + 3 new = 22
    expect(rules.length).toBe(22)
    const families = new Set(rules.map(r => r.family))
    expect(families).toEqual(
      new Set(['milestones', 'mastery', 'skill', 'persistence', 'exploration']),
    )
  })

  it('predicates always return values in [0, 1]', () => {
    const rules = getAchievementRules()
    const stats = makeStats({ currentStreak: 999 })
    for (const r of rules) {
      const p = r.predicate(stats)
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(1)
    }
  })
})

describe('milestones family — kanji thresholds', () => {
  it('progress scales linearly until 100% at threshold', () => {
    const cards = Array.from({ length: 5 }, (_, i) => card(`k${i}`))
    const result = evaluateAchievements(makeStats({ cards }))
    const m10 = result.find(r => r.id === 'milestones.kanji-10')!
    expect(m10.progress).toBe(0.5)
    expect(m10.unlocked).toBe(false)
  })

  it('unlocks at the threshold and persists the unlock date', () => {
    const cards = Array.from({ length: 10 }, (_, i) => card(`k${i}`))
    const result = evaluateAchievements(makeStats({ cards }))
    const m10 = result.find(r => r.id === 'milestones.kanji-10')!
    expect(m10.unlocked).toBe(true)
    expect(m10.unlockedAt).toBe(TODAY)
    expect(loadUnlocks()['milestones.kanji-10']).toBe(TODAY)
  })

  it('does not overwrite an existing unlock date', () => {
    localStorage.setItem(
      'kanji-renshuu-achievement-unlocks',
      JSON.stringify({ 'milestones.kanji-10': '2026-01-01' }),
    )
    const cards = Array.from({ length: 10 }, (_, i) => card(`k${i}`))
    const result = evaluateAchievements(makeStats({ cards }))
    const m10 = result.find(r => r.id === 'milestones.kanji-10')!
    expect(m10.unlockedAt).toBe('2026-01-01')
  })
})

describe('persistence family — streak', () => {
  it('progress scales with the current streak', () => {
    const result = evaluateAchievements(makeStats({ currentStreak: 14 }))
    const r = result.find(x => x.id === 'persistence.streak-7')!
    expect(r.progress).toBe(1)
    expect(r.unlocked).toBe(true)
    const r30 = result.find(x => x.id === 'persistence.streak-30')!
    expect(r30.progress).toBeCloseTo(14 / 30, 5)
  })
})

describe('mastery family — cards reaching Review state', () => {
  it('counts only introduced cards that hit FSRS state 2', () => {
    const cards: CardState[] = [
      ...Array.from({ length: 60 }, (_, i) =>
        card(`m${i}`, { fsrsCard: { state: 2, due: new Date() } as never }),
      ),
      ...Array.from({ length: 40 }, (_, i) =>
        card(`l${i}`, { fsrsCard: { state: 1, due: new Date() } as never }),
      ),
    ]
    const result = evaluateAchievements(makeStats({ cards }))
    const r = result.find(x => x.id === 'mastery.cards-100')!
    expect(r.progress).toBeCloseTo(0.6, 5)
    expect(r.unlocked).toBe(false)
  })
})

describe('skill family — accuracy threshold', () => {
  function dailyStat(date: string, reviews: number, correct: number): DailyStats {
    return { date, reviewsCompleted: reviews, correctCount: correct, newCardsIntroduced: 0, totalTimeMs: 0 }
  }

  it('returns 0 below 85% accuracy', () => {
    const result = evaluateAchievements(
      makeStats({
        dailyStats: [
          dailyStat('2026-04-15', 20, 16), // 80%
          dailyStat('2026-04-16', 20, 16),
        ],
      }),
    )
    const r = result.find(x => x.id === 'skill.accuracy-95')!
    expect(r.progress).toBe(0)
  })

  it('unlocks at 95% accuracy across last 7 days', () => {
    const result = evaluateAchievements(
      makeStats({
        dailyStats: [
          dailyStat('2026-04-19', 50, 48),
          dailyStat('2026-04-20', 50, 48),
        ],
      }),
    )
    const r = result.find(x => x.id === 'skill.accuracy-95')!
    expect(r.unlocked).toBe(true)
  })
})

describe('exploration family — coverage of all grades', () => {
  it('progresses with each new grade introduced', () => {
    const allKanji: KanjiEntry[] = [
      kanji('一', 1),
      kanji('二', 2),
      kanji('三', 3),
      kanji('四', 4),
      kanji('五', 5),
      kanji('六', 6),
      kanji('八', 8),
    ]
    const cards = [card('一'), card('二'), card('三'), card('八')] // 4 of 7
    const result = evaluateAchievements(makeStats({ cards, kanji: allKanji }))
    const r = result.find(x => x.id === 'exploration.all-grades')!
    expect(r.progress).toBeCloseTo(4 / 7, 5)
    expect(r.unlocked).toBe(false)
  })

  it('unlocks when all required grades are covered', () => {
    const allKanji: KanjiEntry[] = [1, 2, 3, 4, 5, 6, 8].map(g => kanji(`k${g}`, g))
    const cards = allKanji.map(k => card(k.literal))
    const result = evaluateAchievements(makeStats({ cards, kanji: allKanji }))
    const r = result.find(x => x.id === 'exploration.all-grades')!
    expect(r.unlocked).toBe(true)
  })
})
