import type { KanjiEntry, CardState } from '@/core/srs/types'
import { getIntroducedCards } from '@/core/storage/db'

/**
 * Get new card candidates sorted by grade then frequency.
 * Excludes already-introduced kanji.
 */
export async function getNewCardCandidates(
  kanjiData: KanjiEntry[],
  limit: number,
): Promise<KanjiEntry[]> {
  const introduced = await getIntroducedCards()
  const introducedSet = new Set(introduced.map(c => c.kanjiLiteral))

  return kanjiData
    .filter(k => !introducedSet.has(k.literal))
    .sort((a, b) => {
      if (a.grade !== b.grade) return a.grade - b.grade
      const aFreq = a.frequency ?? 9999
      const bFreq = b.frequency ?? 9999
      return aFreq - bFreq
    })
    .slice(0, limit)
}

/**
 * Check how many new cards have been introduced today.
 */
export async function getNewCardsIntroducedToday(
  introduced: CardState[],
): Promise<number> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayMs = todayStart.getTime()

  return introduced.filter(
    c => c.introducedAt !== null && c.introducedAt >= todayMs,
  ).length
}
