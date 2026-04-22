import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { deleteDB } from 'idb'
import {
  XP_PER_RATING,
  XP_NEW_CARD_BONUS,
  XP_LEVEL_BASE,
  getLevel,
  xpForLevel,
  xpForNextLevel,
  levelProgress,
  xpForReview,
  getRankKey,
  addXp,
  getLifetimeXp,
} from './xp'
import { _resetDbForTests } from '@/core/storage/db'

const DB_NAME = 'kanji-renshuu'

async function reset(): Promise<void> {
  await _resetDbForTests()
  await deleteDB(DB_NAME)
}

describe('level curve', () => {
  it('level 0 at 0 XP', () => {
    expect(getLevel(0)).toBe(0)
    expect(getLevel(-50)).toBe(0)
  })

  it('level 1 at XP_LEVEL_BASE', () => {
    expect(getLevel(XP_LEVEL_BASE)).toBe(1)
    expect(getLevel(XP_LEVEL_BASE - 1)).toBe(0)
  })

  it('quadratic: level n requires n^2 * base XP', () => {
    expect(getLevel(4 * XP_LEVEL_BASE)).toBe(2)
    expect(getLevel(9 * XP_LEVEL_BASE)).toBe(3)
    expect(getLevel(16 * XP_LEVEL_BASE)).toBe(4)
  })

  it('xpForLevel is the inverse of getLevel at boundaries', () => {
    for (let l = 0; l < 10; l++) {
      expect(getLevel(xpForLevel(l))).toBe(l)
    }
  })

  it('xpForNextLevel decreases as XP grows within a level', () => {
    const level = 3
    const floor = xpForLevel(level)
    const ceil = xpForLevel(level + 1)
    expect(xpForNextLevel(floor)).toBe(ceil - floor)
    expect(xpForNextLevel(floor + 10)).toBe(ceil - floor - 10)
  })

  it('levelProgress returns 0..1 within current level', () => {
    const level = 2
    const floor = xpForLevel(level)
    const ceil = xpForLevel(level + 1)
    expect(levelProgress(floor)).toBe(0)
    expect(levelProgress(Math.floor((floor + ceil) / 2))).toBeGreaterThan(0.4)
    expect(levelProgress(Math.floor((floor + ceil) / 2))).toBeLessThan(0.6)
    expect(levelProgress(ceil - 1)).toBeGreaterThan(0.99)
  })
})

describe('xpForReview', () => {
  it('awards rating-scaled XP', () => {
    expect(xpForReview(1, false)).toBe(XP_PER_RATING[1])
    expect(xpForReview(2, false)).toBe(XP_PER_RATING[2])
    expect(xpForReview(3, false)).toBe(XP_PER_RATING[3])
    expect(xpForReview(4, false)).toBe(XP_PER_RATING[4])
  })

  it('adds the new-card bonus on first introduction', () => {
    expect(xpForReview(3, true)).toBe(XP_PER_RATING[3] + XP_NEW_CARD_BONUS)
  })
})

describe('rank tiers', () => {
  it('starts at apprentice', () => {
    expect(getRankKey(0)).toBe('rank.apprentice')
    expect(getRankKey(4)).toBe('rank.apprentice')
  })

  it('escalates through tiers', () => {
    expect(getRankKey(5)).toBe('rank.student')
    expect(getRankKey(10)).toBe('rank.adept')
    expect(getRankKey(20)).toBe('rank.scholar')
    expect(getRankKey(35)).toBe('rank.master')
    expect(getRankKey(60)).toBe('rank.sage')
    expect(getRankKey(999)).toBe('rank.sage')
  })
})

describe('addXp persistence', () => {
  beforeEach(reset)

  it('starts at 0 lifetime XP', async () => {
    expect(await getLifetimeXp()).toBe(0)
  })

  it('accumulates XP across multiple calls', async () => {
    const a = await addXp(50)
    expect(a.stats.lifetimeXp).toBe(50)
    expect(a.leveledUp).toBe(false)

    const b = await addXp(75)
    expect(b.stats.lifetimeXp).toBe(125)
    expect(b.leveledUp).toBe(true)
    expect(b.previousLevel).toBe(0)
    expect(b.newLevel).toBe(1)
  })

  it('clamps negative XP to 0', async () => {
    const r = await addXp(-9999)
    expect(r.stats.lifetimeXp).toBe(0)
  })

  it('reports no level-up when XP added stays in same band', async () => {
    await addXp(100) // level 1
    const r = await addXp(10)
    expect(r.leveledUp).toBe(false)
    expect(r.previousLevel).toBe(1)
    expect(r.newLevel).toBe(1)
  })
})
