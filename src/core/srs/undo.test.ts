import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { _resetDbForTests, putCardState, addReviewLog, getCardState, getDailyStats, putDailyStats } from '@/core/storage/db'
import { undoLastReview } from './undo'
import type { CardState, ReviewLogEntry } from './types'

beforeEach(async () => {
  await _resetDbForTests()
})

function makeCardState(literal: string): CardState {
  return {
    kanjiLiteral: literal,
    fsrsCard: {
      due: new Date('2030-01-01'),
      stability: 1,
      difficulty: 5,
      elapsed_days: 0,
      scheduled_days: 1,
      reps: 1,
      lapses: 0,
      state: 1,
      last_review: new Date('2024-01-01'),
    } as CardState['fsrsCard'],
    introduced: true,
    introducedAt: 1000,
    lastReviewedAt: 2000,
    totalReviews: 1,
    correctReviews: 1,
  }
}

describe('undoLastReview', () => {
  it('returns no-history when no logs exist', async () => {
    const r = await undoLastReview()
    expect(r.undone).toBe(false)
    expect(r.reason).toBe('no-history')
  })

  it('returns no-snapshot when last log lacks previousCardState', async () => {
    await addReviewLog({
      id: 'l1',
      kanjiLiteral: '一',
      rating: 3,
      mode: 'recognition',
      timestamp: Date.now(),
      date: '2025-01-01',
      responseTimeMs: 1000,
      fsrsLog: {} as ReviewLogEntry['fsrsLog'],
    })
    const r = await undoLastReview()
    expect(r.undone).toBe(false)
    expect(r.reason).toBe('no-snapshot')
  })

  it('restores previousCardState and adjusts daily stats', async () => {
    const previous = makeCardState('木')
    const after = { ...previous, totalReviews: 2, correctReviews: 2 }
    await putCardState(after)
    await putDailyStats({
      date: '2025-01-02',
      newCardsIntroduced: 0,
      reviewsCompleted: 1,
      correctCount: 1,
      totalTimeMs: 1500,
    })
    await addReviewLog({
      id: 'l2',
      kanjiLiteral: '木',
      rating: 3,
      mode: 'recognition',
      timestamp: Date.now(),
      date: '2025-01-02',
      responseTimeMs: 1500,
      fsrsLog: {} as ReviewLogEntry['fsrsLog'],
      previousCardState: previous,
      xpAwarded: 5,
    })
    const r = await undoLastReview()
    expect(r.undone).toBe(true)
    const restored = await getCardState('木')
    expect(restored?.totalReviews).toBe(1)
    const stats = await getDailyStats('2025-01-02')
    expect(stats?.reviewsCompleted).toBe(0)
    expect(stats?.correctCount).toBe(0)
  })

  it('removes the card entirely when the review introduced it', async () => {
    const previous = makeCardState('火')
    await putCardState(previous)
    await addReviewLog({
      id: 'l3',
      kanjiLiteral: '火',
      rating: 3,
      mode: 'recognition',
      timestamp: Date.now(),
      date: '2025-01-03',
      responseTimeMs: 800,
      fsrsLog: {} as ReviewLogEntry['fsrsLog'],
      previousCardState: previous,
      introducedHere: true,
    })
    await undoLastReview()
    expect(await getCardState('火')).toBeUndefined()
  })
})
