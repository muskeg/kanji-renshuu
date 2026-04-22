/**
 * Alternative learning paths (D.3).
 *
 * Each strategy returns a comparator that orders the *new-card candidate
 * pool* (kanji not yet introduced). The review queue builder uses this to
 * decide which kanji to introduce next when the user has free new-card
 * budget for the day.
 *
 * Strategies:
 * - `byGrade`        — Japanese school grade order (default).
 * - `byJlpt`         — N5 → N1 (easiest first); kanji without a JLPT level go last.
 * - `byFrequency`    — Newspaper frequency rank (most common first).
 * - `radicalFirst`   — Single-component / standalone radicals first, then composites.
 * - `byStrokeCount`  — Fewest strokes first.
 */

import type { KanjiEntry, LearningPath } from '@/core/srs/types'

export type PathComparator = (a: KanjiEntry, b: KanjiEntry) => number

const FREQ_FALLBACK = Number.MAX_SAFE_INTEGER

/** Stable secondary sort key — keeps deterministic order across runs. */
function tiebreak(a: KanjiEntry, b: KanjiEntry): number {
  return a.literal.localeCompare(b.literal)
}

const COMPARATORS: Record<LearningPath, PathComparator> = {
  byGrade: (a, b) => {
    if (a.grade !== b.grade) return a.grade - b.grade
    const af = a.frequency ?? FREQ_FALLBACK
    const bf = b.frequency ?? FREQ_FALLBACK
    if (af !== bf) return af - bf
    return tiebreak(a, b)
  },

  byJlpt: (a, b) => {
    // N5 (5) is easiest. Treat null as harder-than-N1.
    const an = a.jlptN ?? 0
    const bn = b.jlptN ?? 0
    if (an !== bn) return bn - an
    const af = a.frequency ?? FREQ_FALLBACK
    const bf = b.frequency ?? FREQ_FALLBACK
    if (af !== bf) return af - bf
    return tiebreak(a, b)
  },

  byFrequency: (a, b) => {
    const af = a.frequency ?? FREQ_FALLBACK
    const bf = b.frequency ?? FREQ_FALLBACK
    if (af !== bf) return af - bf
    return tiebreak(a, b)
  },

  radicalFirst: (a, b) => {
    // Treat kanji with no listed components (or only itself) as "radicals".
    // Among radicals, sort by stroke count then frequency.
    const aIsRadical = isRadicalLike(a)
    const bIsRadical = isRadicalLike(b)
    if (aIsRadical !== bIsRadical) return aIsRadical ? -1 : 1
    if (a.strokeCount !== b.strokeCount) return a.strokeCount - b.strokeCount
    const af = a.frequency ?? FREQ_FALLBACK
    const bf = b.frequency ?? FREQ_FALLBACK
    if (af !== bf) return af - bf
    return tiebreak(a, b)
  },

  byStrokeCount: (a, b) => {
    if (a.strokeCount !== b.strokeCount) return a.strokeCount - b.strokeCount
    const af = a.frequency ?? FREQ_FALLBACK
    const bf = b.frequency ?? FREQ_FALLBACK
    if (af !== bf) return af - bf
    return tiebreak(a, b)
  },
}

function isRadicalLike(k: KanjiEntry): boolean {
  if (k.components.length === 0) return true
  if (k.components.length === 1 && k.components[0] === k.literal) return true
  return false
}

/** Get the comparator for a given learning path. */
export function getPathComparator(path: LearningPath): PathComparator {
  return COMPARATORS[path] ?? COMPARATORS.byGrade
}

/** Sort a candidate pool of new kanji per the configured learning path. */
export function sortByPath(pool: KanjiEntry[], path: LearningPath): KanjiEntry[] {
  return [...pool].sort(getPathComparator(path))
}
