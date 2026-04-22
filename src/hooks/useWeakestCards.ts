import { useEffect, useState } from 'react'
import { getAllReviewLogs } from '@/core/storage/db'
import type { KanjiEntry } from '@/core/srs/types'

export interface WeakestCard {
  literal: string
  kanji: KanjiEntry | undefined
  reviews: number
  correct: number
  retention: number
}

/**
 * Compute the N kanji with the lowest retention over the last `days` days.
 * Cards reviewed fewer than `minReviews` times are excluded so the list isn't
 * dominated by single-rating noise.
 */
export function useWeakestCards(
  kanjiData: KanjiEntry[],
  options: { limit?: number; days?: number; minReviews?: number } = {},
): { cards: WeakestCard[]; loading: boolean } {
  const { limit = 20, days = 30, minReviews = 2 } = options
  const [state, setState] = useState<{ cards: WeakestCard[]; loading: boolean }>({
    cards: [],
    loading: true,
  })

  useEffect(() => {
    let cancelled = false
    async function run() {
      const logs = await getAllReviewLogs()
      const cutoff = Date.now() - days * 86_400_000
      const recent = logs.filter(l => l.timestamp >= cutoff)

      const byLiteral = new Map<string, { reviews: number; correct: number }>()
      for (const l of recent) {
        const e = byLiteral.get(l.kanjiLiteral) ?? { reviews: 0, correct: 0 }
        e.reviews++
        if (l.rating >= 3) e.correct++
        byLiteral.set(l.kanjiLiteral, e)
      }

      const kanjiByLiteral = new Map(kanjiData.map(k => [k.literal, k]))
      const cards: WeakestCard[] = []
      for (const [literal, { reviews, correct }] of byLiteral) {
        if (reviews < minReviews) continue
        cards.push({
          literal,
          kanji: kanjiByLiteral.get(literal),
          reviews,
          correct,
          retention: correct / reviews,
        })
      }
      cards.sort((a, b) => a.retention - b.retention || b.reviews - a.reviews)
      if (!cancelled) {
        setState({ cards: cards.slice(0, limit), loading: false })
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [kanjiData, limit, days, minReviews])

  return state
}
