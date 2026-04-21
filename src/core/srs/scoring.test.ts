import { describe, it, expect, beforeEach } from 'vitest'
import { computeSessionScore, recordScore } from './scoring'
import type { SessionSummaryData } from './types'

function makeSummary(overrides: Partial<SessionSummaryData> = {}): SessionSummaryData {
  return {
    totalReviewed: 10,
    correctCount: 8,
    againCount: 1,
    hardCount: 1,
    goodCount: 6,
    easyCount: 2,
    newCardsIntroduced: 2,
    totalTimeMs: 40_000,
    reviewedCards: [],
    ...overrides,
  } as SessionSummaryData
}

describe('computeSessionScore', () => {
  it('returns zeros for an empty session', () => {
    const score = computeSessionScore(makeSummary({ totalReviewed: 0, correctCount: 0, totalTimeMs: 0 }), 0)
    expect(score.base).toBe(0)
    expect(score.accuracyBonus).toBe(0)
    expect(score.speedBonus).toBe(0)
    expect(score.streakMultiplier).toBe(1)
    expect(score.total).toBe(0)
  })

  it('awards 10 points per card as base', () => {
    const score = computeSessionScore(makeSummary({ totalReviewed: 7, correctCount: 7 }), 0)
    expect(score.base).toBe(70)
  })

  it('scales accuracy bonus by accuracy', () => {
    // 5/10 correct → 50% accuracy → bonus = 50% of base (100)
    const score = computeSessionScore(
      makeSummary({ totalReviewed: 10, correctCount: 5, totalTimeMs: 80_000 }),
      0,
    )
    expect(score.accuracyBonus).toBe(50)
  })

  it('awards a speed bonus only under the time thresholds', () => {
    const fast = computeSessionScore(
      makeSummary({ totalReviewed: 10, correctCount: 10, totalTimeMs: 20_000 }), // 2s/card
      0,
    )
    const slow = computeSessionScore(
      makeSummary({ totalReviewed: 10, correctCount: 10, totalTimeMs: 100_000 }), // 10s/card
      0,
    )
    expect(fast.speedBonus).toBeGreaterThan(0)
    expect(slow.speedBonus).toBe(0)
  })

  it('caps streak multiplier at 3.0', () => {
    const score = computeSessionScore(makeSummary(), 999)
    expect(score.streakMultiplier).toBe(3)
  })
})

describe('recordScore', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('marks the first non-zero score as a personal best', () => {
    const result = recordScore(500)
    expect(result.isPersonalBest).toBe(true)
    expect(result.previousBest).toBe(0)
  })

  it('returns isPersonalBest=false when the new score does not beat the all-time best', () => {
    recordScore(500)
    const second = recordScore(300)
    expect(second.isPersonalBest).toBe(false)
    expect(second.previousBest).toBe(500)
  })

  it('returns isPersonalBest=true when beating the all-time best', () => {
    recordScore(500)
    const second = recordScore(800)
    expect(second.isPersonalBest).toBe(true)
    expect(second.previousBest).toBe(500)
  })
})
