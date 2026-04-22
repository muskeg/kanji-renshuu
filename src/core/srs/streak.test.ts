import { describe, it, expect } from 'vitest'
import { computeStreakWithFreezes, longestRun, shouldAwardFreeze, MAX_FREEZES } from './streak'

const TODAY = '2026-04-21'

function days(...isos: string[]): string[] {
  return isos
}

describe('computeStreakWithFreezes', () => {
  it('returns 0 for empty history', () => {
    const r = computeStreakWithFreezes([], [], 0, TODAY)
    expect(r.current).toBe(0)
    expect(r.longest).toBe(0)
  })

  it('counts a 3-day streak ending today', () => {
    const r = computeStreakWithFreezes(
      days('2026-04-19', '2026-04-20', '2026-04-21'),
      [],
      0,
      TODAY,
    )
    expect(r.current).toBe(3)
    expect(r.freezesNeeded).toEqual([])
  })

  it('counts streak ending yesterday when today is empty', () => {
    const r = computeStreakWithFreezes(
      days('2026-04-19', '2026-04-20'),
      [],
      0,
      TODAY,
    )
    expect(r.current).toBe(2)
  })

  it('breaks the streak with no freezes available', () => {
    const r = computeStreakWithFreezes(
      days('2026-04-18', '2026-04-20', '2026-04-21'), // 19th missed
      [],
      0,
      TODAY,
    )
    expect(r.current).toBe(2) // 21 + 20, then breaks at 19
    expect(r.freezesNeeded).toEqual([])
  })

  it('burns a freeze to bridge a single-day gap', () => {
    const r = computeStreakWithFreezes(
      days('2026-04-18', '2026-04-20', '2026-04-21'),
      [],
      1,
      TODAY,
    )
    expect(r.current).toBe(4) // 21, 20, freeze 19, 18
    expect(r.freezesNeeded).toEqual(['2026-04-19'])
  })

  it('honours pre-existing frozen dates without requesting more freezes', () => {
    const r = computeStreakWithFreezes(
      days('2026-04-18', '2026-04-20', '2026-04-21'),
      ['2026-04-19'],
      0,
      TODAY,
    )
    expect(r.current).toBe(4)
    expect(r.freezesNeeded).toEqual([])
  })

  it('returns no current streak when both today and yesterday are missed', () => {
    const r = computeStreakWithFreezes(
      days('2026-04-15', '2026-04-16', '2026-04-17'),
      [],
      99,
      TODAY,
    )
    expect(r.current).toBe(0)
    expect(r.longest).toBe(3)
  })

  it('does not spend more freezes than the available budget', () => {
    const r = computeStreakWithFreezes(
      days('2026-04-15', '2026-04-21'), // gaps 16, 17, 18, 19, 20
      [],
      2,
      TODAY,
    )
    // Today + 2 frozen days back = 3
    expect(r.current).toBe(3)
    expect(r.freezesNeeded).toHaveLength(2)
  })
})

describe('longestRun', () => {
  it('returns 0 for empty', () => {
    expect(longestRun(new Set())).toBe(0)
  })

  it('finds the longest contiguous run', () => {
    const dates = new Set([
      '2026-01-01', '2026-01-02', '2026-01-03',
      '2026-02-01', '2026-02-02', '2026-02-03', '2026-02-04', '2026-02-05',
      '2026-03-10',
    ])
    expect(longestRun(dates)).toBe(5)
  })
})

describe('shouldAwardFreeze', () => {
  it('awards on 7-day boundaries when under cap', () => {
    expect(shouldAwardFreeze(7, 0)).toBe(true)
    expect(shouldAwardFreeze(14, 1)).toBe(true)
  })

  it('does not award off-boundary', () => {
    expect(shouldAwardFreeze(6, 0)).toBe(false)
    expect(shouldAwardFreeze(8, 0)).toBe(false)
  })

  it('caps at MAX_FREEZES', () => {
    expect(shouldAwardFreeze(7, MAX_FREEZES)).toBe(false)
  })
})
