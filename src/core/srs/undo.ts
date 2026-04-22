/**
 * Undo last review (D.5).
 *
 * Reverts the most recent review entry by:
 *   1. Restoring the previous CardState snapshot (or removing the card
 *      entirely if the review introduced it for the first time).
 *   2. Deleting the review log entry.
 *   3. Adjusting daily stats and lifetime XP to subtract the review's
 *      contribution.
 *
 * Limitations:
 *   - Only works for review logs written after this change shipped (older
 *     logs lack the `previousCardState` snapshot).
 *   - Lesson checkpoint XP is *not* refunded — it would require recomputing
 *     whether the undo crosses back over a lesson boundary, which is a rare
 *     edge case for the "I just misclicked" use case this targets.
 */

import type { ReviewLogEntry } from './types'
import {
  getLastReviewLog,
  deleteReviewLog,
  putCardState,
  deleteCardState,
  getDailyStats,
  putDailyStats,
  getUserStats,
  putUserStats,
} from '@/core/storage/db'
import { USER_STATS_EVENT } from '@/core/gamification/xp'

export interface UndoResult {
  /** True if a review was successfully undone. */
  undone: boolean
  /** Reason for failure when `undone` is false. */
  reason?: 'no-history' | 'no-snapshot'
  /** The log entry that was reverted (when successful). */
  entry?: ReviewLogEntry
}

export async function undoLastReview(): Promise<UndoResult> {
  const last = await getLastReviewLog()
  if (!last) return { undone: false, reason: 'no-history' }
  if (!last.previousCardState) return { undone: false, reason: 'no-snapshot' }

  // 1. Restore card state. If the review was the very first introduction of
  //    this card, remove the card record entirely.
  if (last.introducedHere) {
    await deleteCardState(last.kanjiLiteral)
  } else {
    await putCardState(last.previousCardState)
  }

  // 2. Adjust daily stats.
  const stats = await getDailyStats(last.date)
  if (stats) {
    const isCorrect = last.rating >= 3
    await putDailyStats({
      ...stats,
      reviewsCompleted: Math.max(0, stats.reviewsCompleted - 1),
      correctCount: Math.max(0, stats.correctCount - (isCorrect ? 1 : 0)),
      newCardsIntroduced: Math.max(0, stats.newCardsIntroduced - (last.introducedHere ? 1 : 0)),
      totalTimeMs: Math.max(0, stats.totalTimeMs - last.responseTimeMs),
    })
  }

  // 3. Subtract XP awarded by the review (if recorded).
  if (last.xpAwarded && last.xpAwarded > 0) {
    const userStats = await getUserStats()
    const next = {
      ...userStats,
      lifetimeXp: Math.max(0, userStats.lifetimeXp - last.xpAwarded),
      updatedAt: Date.now(),
    }
    await putUserStats(next)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(USER_STATS_EVENT, { detail: next }))
    }
  }

  // 4. Remove the log entry itself.
  await deleteReviewLog(last.id)

  return { undone: true, entry: last }
}
