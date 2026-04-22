import { useEffect, useState } from 'react'
import { getAllReviewLogs } from '@/core/storage/db'
import type { QuizMode } from '@/core/srs/types'

export interface ModeAccuracy {
  mode: QuizMode
  reviews: number
  correct: number
  accuracy: number
}

const ALL_MODES: QuizMode[] = ['recognition', 'meaning', 'reading', 'writing']

/**
 * Per-mode accuracy aggregated over the last `days` days.
 * Modes with zero reviews are still returned (with accuracy 0) so UI can show
 * a placeholder bar.
 */
export function useModeAccuracy(days = 30): { data: ModeAccuracy[]; loading: boolean } {
  const [state, setState] = useState<{ data: ModeAccuracy[]; loading: boolean }>({
    data: [],
    loading: true,
  })

  useEffect(() => {
    let cancelled = false
    async function run() {
      const logs = await getAllReviewLogs()
      const cutoff = Date.now() - days * 86_400_000
      const recent = logs.filter(l => l.timestamp >= cutoff)

      const totals = new Map<QuizMode, { reviews: number; correct: number }>()
      for (const m of ALL_MODES) totals.set(m, { reviews: 0, correct: 0 })
      for (const l of recent) {
        const e = totals.get(l.mode) ?? { reviews: 0, correct: 0 }
        e.reviews++
        if (l.rating >= 3) e.correct++
        totals.set(l.mode, e)
      }
      const data: ModeAccuracy[] = ALL_MODES.map(mode => {
        const e = totals.get(mode)!
        return {
          mode,
          reviews: e.reviews,
          correct: e.correct,
          accuracy: e.reviews > 0 ? e.correct / e.reviews : 0,
        }
      })
      if (!cancelled) setState({ data, loading: false })
    }
    run()
    return () => {
      cancelled = true
    }
  }, [days])

  return state
}
