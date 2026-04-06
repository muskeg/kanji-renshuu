import { describe, it, expect } from 'vitest'
import {
  createNewCardState,
  reviewCard,
  ratingFromValue,
  isDue,
  isNewCard,
} from '@/core/srs/scheduler'
import { Rating } from 'ts-fsrs'

describe('scheduler', () => {
  describe('createNewCardState', () => {
    it('creates a card state with default values', () => {
      const state = createNewCardState('日')
      expect(state.kanjiLiteral).toBe('日')
      expect(state.introduced).toBe(false)
      expect(state.introducedAt).toBeNull()
      expect(state.totalReviews).toBe(0)
      expect(state.correctReviews).toBe(0)
      expect(state.lastReviewedAt).toBeNull()
      expect(state.fsrsCard).toBeDefined()
    })
  })

  describe('ratingFromValue', () => {
    it('maps 1 to Again', () => {
      expect(ratingFromValue(1)).toBe(Rating.Again)
    })
    it('maps 2 to Hard', () => {
      expect(ratingFromValue(2)).toBe(Rating.Hard)
    })
    it('maps 3 to Good', () => {
      expect(ratingFromValue(3)).toBe(Rating.Good)
    })
    it('maps 4 to Easy', () => {
      expect(ratingFromValue(4)).toBe(Rating.Easy)
    })
  })

  describe('reviewCard', () => {
    it('returns updated card and log for Again', () => {
      const state = createNewCardState('日')
      const result = reviewCard(state.fsrsCard, 1)
      expect(result.card).toBeDefined()
      expect(result.log).toBeDefined()
      expect(result.card.due).toBeDefined()
    })

    it('returns updated card and log for Good', () => {
      const state = createNewCardState('月')
      const result = reviewCard(state.fsrsCard, 3)
      expect(result.card).toBeDefined()
      expect(result.log).toBeDefined()
    })

    it('schedules Easy further in future than Again', () => {
      const state = createNewCardState('火')
      const now = new Date()
      const againResult = reviewCard(state.fsrsCard, 1, now)
      const easyResult = reviewCard(state.fsrsCard, 4, now)

      const againDue = new Date(againResult.card.due).getTime()
      const easyDue = new Date(easyResult.card.due).getTime()
      expect(easyDue).toBeGreaterThanOrEqual(againDue)
    })

    it('processes all four rating values without error', () => {
      const state = createNewCardState('水')
      const ratings = [1, 2, 3, 4] as const
      for (const rating of ratings) {
        const result = reviewCard(state.fsrsCard, rating)
        expect(result.card).toBeDefined()
        expect(result.log).toBeDefined()
      }
    })
  })

  describe('isDue', () => {
    it('returns true for new cards (due in past)', () => {
      const state = createNewCardState('木')
      expect(isDue(state.fsrsCard)).toBe(true)
    })

    it('returns false for cards due in the future', () => {
      const state = createNewCardState('金')
      const result = reviewCard(state.fsrsCard, 3)
      const futureCard = result.card
      // Card should be due in the future after a Good rating
      expect(isDue(futureCard, new Date())).toBe(false)
    })
  })

  describe('isNewCard', () => {
    it('returns true for unintroduced cards', () => {
      const state = createNewCardState('土')
      expect(isNewCard(state)).toBe(true)
    })

    it('returns false for introduced cards', () => {
      const state = createNewCardState('土')
      state.introduced = true
      expect(isNewCard(state)).toBe(false)
    })
  })
})
