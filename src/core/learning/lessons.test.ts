import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { _resetDbForTests, getDB } from '@/core/storage/db'
import { LESSON_BONUS_XP, LESSON_CHECKPOINT_EVENT, awardLessonBonusIfDue } from './lessons'
import { getLifetimeXp } from '@/core/gamification/xp'

beforeEach(async () => {
  await _resetDbForTests()
  const db = await getDB()
  await db.clear('userStats')
})

describe('awardLessonBonusIfDue', () => {
  it('awards no bonus mid-lesson', async () => {
    const before = await getLifetimeXp()
    const awarded = await awardLessonBonusIfDue(3)
    expect(awarded).toBe(0)
    expect(await getLifetimeXp()).toBe(before)
  })

  it('awards LESSON_BONUS_XP at every lesson boundary', async () => {
    const before = await getLifetimeXp()
    const awarded = await awardLessonBonusIfDue(5)
    expect(awarded).toBe(LESSON_BONUS_XP)
    expect(await getLifetimeXp()).toBe(before + LESSON_BONUS_XP)
  })

  it('emits LESSON_CHECKPOINT_EVENT on boundary', async () => {
    const handler = vi.fn()
    window.addEventListener(LESSON_CHECKPOINT_EVENT, handler)
    await awardLessonBonusIfDue(10)
    expect(handler).toHaveBeenCalledOnce()
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail as { lessonNumber: number }
    expect(detail.lessonNumber).toBe(2)
    window.removeEventListener(LESSON_CHECKPOINT_EVENT, handler)
  })

  it('does not award for zero or negative', async () => {
    expect(await awardLessonBonusIfDue(0)).toBe(0)
    expect(await awardLessonBonusIfDue(-5)).toBe(0)
  })
})
