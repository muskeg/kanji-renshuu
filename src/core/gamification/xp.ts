import type { RatingValue, UserStats } from '@/core/srs/types'
import { getUserStats, putUserStats } from '@/core/storage/db'

/** Window event fired whenever userStats are mutated in storage. */
export const USER_STATS_EVENT = 'kanji-renshuu-userstats-change'
/** Window event fired when a review crosses a level threshold. */
export const LEVEL_UP_EVENT = 'kanji-renshuu-levelup'

export interface LevelUpEventDetail {
  previousLevel: number
  newLevel: number
  stats: UserStats
}

/** XP awarded per rating. Easy > Good > Hard > Again. */
export const XP_PER_RATING: Record<RatingValue, number> = {
  1: 5, // Again — partial credit for showing up
  2: 10, // Hard
  3: 15, // Good
  4: 20, // Easy
}

/** Bonus XP for introducing a new kanji (one-time per card). */
export const XP_NEW_CARD_BONUS = 10

/**
 * Quadratic level curve: `level = floor(sqrt(xp / XP_LEVEL_BASE))`.
 * Inverse: xp required for `n` levels = `n^2 * XP_LEVEL_BASE`.
 */
export const XP_LEVEL_BASE = 100

/** Compute level from total lifetime XP. */
export function getLevel(xp: number): number {
  if (xp <= 0) return 0
  return Math.floor(Math.sqrt(xp / XP_LEVEL_BASE))
}

/** XP threshold required to *reach* the given level. */
export function xpForLevel(level: number): number {
  if (level <= 0) return 0
  return level * level * XP_LEVEL_BASE
}

/** XP still needed to reach the next level from the given xp total. */
export function xpForNextLevel(xp: number): number {
  const next = getLevel(xp) + 1
  return xpForLevel(next) - xp
}

/** Progress (0..1) within the current level. */
export function levelProgress(xp: number): number {
  const level = getLevel(xp)
  const floor = xpForLevel(level)
  const ceil = xpForLevel(level + 1)
  if (ceil === floor) return 0
  return Math.max(0, Math.min(1, (xp - floor) / (ceil - floor)))
}

/** XP to award for a single review rating, with optional new-card bonus. */
export function xpForReview(rating: RatingValue, isNew: boolean): number {
  return XP_PER_RATING[rating] + (isNew ? XP_NEW_CARD_BONUS : 0)
}

/** Sensei rank tiers, indexed by level threshold. Highest match wins. */
export const RANKS = [
  { minLevel: 0, key: 'rank.apprentice' },
  { minLevel: 5, key: 'rank.student' },
  { minLevel: 10, key: 'rank.adept' },
  { minLevel: 20, key: 'rank.scholar' },
  { minLevel: 35, key: 'rank.master' },
  { minLevel: 60, key: 'rank.sage' },
] as const

export type RankKey = (typeof RANKS)[number]['key']

export function getRankKey(level: number): RankKey {
  let current: RankKey = RANKS[0].key
  for (const r of RANKS) {
    if (level >= r.minLevel) current = r.key
  }
  return current
}

/**
 * Add XP to the persisted user stats. Returns the updated stats and whether
 * a level-up happened during this call (so callers can fire UI effects).
 */
export async function addXp(
  amount: number,
): Promise<{ stats: UserStats; previousLevel: number; newLevel: number; leveledUp: boolean }> {
  const current = await getUserStats()
  const previousLevel = getLevel(current.lifetimeXp)
  const next: UserStats = {
    ...current,
    lifetimeXp: Math.max(0, current.lifetimeXp + amount),
    updatedAt: Date.now(),
  }
  await putUserStats(next)
  const newLevel = getLevel(next.lifetimeXp)
  const leveledUp = newLevel > previousLevel
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(USER_STATS_EVENT, { detail: next }))
    if (leveledUp) {
      window.dispatchEvent(
        new CustomEvent(LEVEL_UP_EVENT, {
          detail: { previousLevel, newLevel, stats: next },
        }),
      )
    }
  }
  return { stats: next, previousLevel, newLevel, leveledUp }
}

/** Convenience: fetch lifetime XP only. */
export async function getLifetimeXp(): Promise<number> {
  const stats = await getUserStats()
  return stats.lifetimeXp
}
