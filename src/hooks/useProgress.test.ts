import { describe, it, expect } from 'vitest'

// Test streak calculation logic extracted for testing
function calculateStreak(dates: string[], today: string): number {
  const dateSet = new Set(dates)
  if (dateSet.size === 0) return 0

  const todayDate = new Date(today)
  const yesterdayDate = new Date(todayDate)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0]

  if (!dateSet.has(today) && !dateSet.has(yesterdayStr)) return 0

  const startDate = dateSet.has(today) ? todayDate : yesterdayDate
  let streak = 0
  const d = new Date(startDate)
  while (dateSet.has(d.toISOString().split('T')[0])) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

function calculateRetention(stats: { reviewsCompleted: number; correctCount: number }[]): number {
  const totalReviews = stats.reduce((sum, s) => sum + s.reviewsCompleted, 0)
  const totalCorrect = stats.reduce((sum, s) => sum + s.correctCount, 0)
  return totalReviews > 0 ? totalCorrect / totalReviews : 0
}

describe('progress calculations', () => {
  describe('calculateStreak', () => {
    it('returns 0 for no activity', () => {
      expect(calculateStreak([], '2026-04-06')).toBe(0)
    })

    it('returns 1 for activity only today', () => {
      expect(calculateStreak(['2026-04-06'], '2026-04-06')).toBe(1)
    })

    it('counts consecutive days', () => {
      expect(calculateStreak(['2026-04-04', '2026-04-05', '2026-04-06'], '2026-04-06')).toBe(3)
    })

    it('breaks on gaps', () => {
      expect(calculateStreak(['2026-04-03', '2026-04-05', '2026-04-06'], '2026-04-06')).toBe(2)
    })

    it('counts from yesterday if no activity today', () => {
      expect(calculateStreak(['2026-04-04', '2026-04-05'], '2026-04-06')).toBe(2)
    })

    it('returns 0 if last activity was 2+ days ago', () => {
      expect(calculateStreak(['2026-04-03'], '2026-04-06')).toBe(0)
    })
  })

  describe('calculateRetention', () => {
    it('returns 0 for no reviews', () => {
      expect(calculateRetention([])).toBe(0)
    })

    it('calculates correct ratio', () => {
      expect(calculateRetention([
        { reviewsCompleted: 10, correctCount: 8 },
        { reviewsCompleted: 10, correctCount: 9 },
      ])).toBeCloseTo(0.85)
    })

    it('returns 1.0 for perfect accuracy', () => {
      expect(calculateRetention([
        { reviewsCompleted: 20, correctCount: 20 },
      ])).toBe(1)
    })
  })
})
