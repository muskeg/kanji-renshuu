import { describe, it, expect } from 'vitest'
import { sortByPath, getPathComparator } from './paths'
import type { KanjiEntry } from '@/core/srs/types'

function k(
  literal: string,
  opts: { grade?: number; jlptN?: 1 | 2 | 3 | 4 | 5 | null; frequency?: number | null; strokeCount?: number; components?: string[] } = {},
): KanjiEntry {
  return {
    literal,
    grade: opts.grade ?? 1,
    jlpt: null,
    jlptN: opts.jlptN ?? null,
    strokeCount: opts.strokeCount ?? 1,
    frequency: opts.frequency ?? null,
    radical: 1,
    readings: { onYomi: [], kunYomi: [], nanori: [] },
    meanings: [],
    meaningsFr: [],
    strokeOrderSvg: '',
    components: opts.components ?? [],
  }
}

const pool: KanjiEntry[] = [
  k('一', { grade: 1, jlptN: 5, frequency: 2, strokeCount: 1 }),
  k('語', { grade: 2, jlptN: 4, frequency: 301, strokeCount: 14, components: ['言', '吾'] }),
  k('鬱', { grade: 8, jlptN: 1, frequency: 2500, strokeCount: 29, components: ['林', '缶'] }),
  k('木', { grade: 1, jlptN: 5, frequency: 350, strokeCount: 4, components: ['木'] }),
  k('銀', { grade: 3, jlptN: 3, frequency: 600, strokeCount: 14, components: ['金', '艮'] }),
]

describe('sortByPath', () => {
  it('byGrade orders by grade then frequency', () => {
    const sorted = sortByPath(pool, 'byGrade').map(p => p.literal)
    // Grade 1: 一(freq 2), 木(freq 350) ; Grade 2: 語 ; Grade 3: 銀 ; Grade 8: 鬱
    expect(sorted).toEqual(['一', '木', '語', '銀', '鬱'])
  })

  it('byJlpt orders N5 before N1, null last', () => {
    const sorted = sortByPath(pool, 'byJlpt').map(p => p.literal)
    // N5: 一(freq 2), 木(freq 350) ; N4: 語 ; N3: 銀 ; N1: 鬱
    expect(sorted).toEqual(['一', '木', '語', '銀', '鬱'])
  })

  it('byFrequency orders most-frequent first', () => {
    const sorted = sortByPath(pool, 'byFrequency').map(p => p.literal)
    expect(sorted).toEqual(['一', '語', '木', '銀', '鬱'])
  })

  it('byStrokeCount orders fewest strokes first', () => {
    const sorted = sortByPath(pool, 'byStrokeCount').map(p => p.literal)
    // 一(1), 木(4), 語(14, freq 301), 銀(14, freq 600), 鬱(29)
    expect(sorted).toEqual(['一', '木', '語', '銀', '鬱'])
  })

  it('radicalFirst puts standalone-component kanji first', () => {
    const sorted = sortByPath(pool, 'radicalFirst').map(p => p.literal)
    // Radical-like (components empty or self): 一, 木 ; then composites by stroke count
    expect(sorted.slice(0, 2).sort()).toEqual(['一', '木'].sort())
    expect(sorted.slice(2)).toEqual(['語', '銀', '鬱'])
  })

  it('comparator is deterministic for ties', () => {
    const cmp = getPathComparator('byGrade')
    const a = k('A', { grade: 1, frequency: 100 })
    const b = k('B', { grade: 1, frequency: 100 })
    expect(cmp(a, b)).toBe(-1)
    expect(cmp(b, a)).toBe(1)
  })
})
