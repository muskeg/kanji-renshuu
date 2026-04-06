import type { KanjiEntry } from '@/core/srs/types'

// Grade-based data files for lazy loading
const GRADE_FILES: Record<number, () => Promise<{ default: KanjiEntry[] }>> = {
  1: () => import('@/data/kanji-g1.json'),
  2: () => import('@/data/kanji-g2.json'),
  3: () => import('@/data/kanji-g3.json'),
  4: () => import('@/data/kanji-g4.json'),
  5: () => import('@/data/kanji-g5.json'),
  6: () => import('@/data/kanji-g6.json'),
  8: () => import('@/data/kanji-g8.json'),
}

const kanjiCache = new Map<number, KanjiEntry[]>()
let allKanjiCache: KanjiEntry[] | null = null

/** Load kanji data for a specific grade */
export async function loadKanjiByGrade(grade: number): Promise<KanjiEntry[]> {
  const cached = kanjiCache.get(grade)
  if (cached) return cached

  const loader = GRADE_FILES[grade]
  if (!loader) return []

  try {
    const module = await loader()
    const data = module.default
    kanjiCache.set(grade, data)
    return data
  } catch {
    console.warn(`Failed to load kanji data for grade ${grade}`)
    return []
  }
}

/** Load all kanji data (all grades) */
export async function loadAllKanji(): Promise<KanjiEntry[]> {
  if (allKanjiCache) return allKanjiCache

  const grades = [1, 2, 3, 4, 5, 6, 8]
  const results = await Promise.all(grades.map(g => loadKanjiByGrade(g)))
  allKanjiCache = results.flat()
  return allKanjiCache
}

/** Find a kanji entry by its literal character */
export function findKanji(allKanji: KanjiEntry[], literal: string): KanjiEntry | undefined {
  return allKanji.find(k => k.literal === literal)
}
