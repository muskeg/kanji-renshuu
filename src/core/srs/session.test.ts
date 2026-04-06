import { describe, it, expect } from 'vitest'
import { computeSessionSummary } from '@/core/srs/session'

describe('session', () => {
  describe('computeSessionSummary', () => {
    it('computes correct summary for mixed ratings', () => {
      const ratings = [1, 2, 3, 4, 3, 1] as const
      const summary = computeSessionSummary([...ratings], 2, 60000)

      expect(summary.totalReviewed).toBe(6)
      expect(summary.correctCount).toBe(3) // ratings 3, 4, 3
      expect(summary.againCount).toBe(2)
      expect(summary.hardCount).toBe(1)
      expect(summary.goodCount).toBe(2)
      expect(summary.easyCount).toBe(1)
      expect(summary.newCardsIntroduced).toBe(2)
      expect(summary.totalTimeMs).toBe(60000)
    })

    it('handles empty session', () => {
      const summary = computeSessionSummary([], 0, 0)
      expect(summary.totalReviewed).toBe(0)
      expect(summary.correctCount).toBe(0)
      expect(summary.againCount).toBe(0)
    })

    it('handles all-correct session', () => {
      const ratings = [3, 4, 3, 4] as const
      const summary = computeSessionSummary([...ratings], 0, 30000)
      expect(summary.correctCount).toBe(4)
      expect(summary.againCount).toBe(0)
      expect(summary.hardCount).toBe(0)
    })
  })
})
