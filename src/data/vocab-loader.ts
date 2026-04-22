/**
 * Lazy loader for JMdict-derived vocabulary, mirroring the kanji loader.
 *
 * Bundles are split per grade so that selecting a grade only pays for that
 * grade's vocab (~30-450 KB raw / ~10-130 KB gzipped).
 */

import type { VocabExample } from '@/core/srs/types'

type VocabFile = Record<string, VocabExample[]>

const VOCAB_FILES: Record<number, () => Promise<{ default: unknown }>> = {
  1: () => import('@/data/vocab-g1.json'),
  2: () => import('@/data/vocab-g2.json'),
  3: () => import('@/data/vocab-g3.json'),
  4: () => import('@/data/vocab-g4.json'),
  5: () => import('@/data/vocab-g5.json'),
  6: () => import('@/data/vocab-g6.json'),
  8: () => import('@/data/vocab-g8.json'),
}

const cache = new Map<number, VocabFile>()

export async function loadVocabByGrade(grade: number): Promise<VocabFile> {
  const cached = cache.get(grade)
  if (cached) return cached
  const loader = VOCAB_FILES[grade]
  if (!loader) return {}
  try {
    const module = await loader()
    const data = module.default as VocabFile
    cache.set(grade, data)
    return data
  } catch {
    console.warn(`Failed to load vocab for grade ${grade}`)
    return {}
  }
}

/** Get vocabulary examples for a single kanji literal of known grade. */
export async function getVocabFor(literal: string, grade: number): Promise<VocabExample[]> {
  const file = await loadVocabByGrade(grade)
  return file[literal] ?? []
}
