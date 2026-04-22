import { useState, useEffect } from 'react'
import type { KanjiEntry } from '@/core/srs/types'
import { evaluateAchievements, type EvaluatedAchievement } from '@/core/gamification/achievements'
import { getAllCardStates, getAllDailyStats, todayDateString } from '@/core/storage/db'

/**
 * Returns the evaluated list of all achievements (unlocked and in-progress).
 * Re-evaluates whenever the kanji dataset reference changes — typically once
 * per page load.
 */
export function useAchievements(kanjiData: KanjiEntry[]): {
  achievements: EvaluatedAchievement[]
  loading: boolean
} {
  const [achievements, setAchievements] = useState<EvaluatedAchievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function compute() {
      const [cards, dailyStats] = await Promise.all([
        getAllCardStates(),
        getAllDailyStats(),
      ])
      if (cancelled) return

      const today = todayDateString()
      const statsSet = new Set(
        dailyStats.filter(s => s.reviewsCompleted > 0).map(s => s.date),
      )
      let streak = 0
      const d = new Date()
      if (!statsSet.has(today)) d.setDate(d.getDate() - 1)
      while (statsSet.has(d.toISOString().split('T')[0]!)) {
        streak += 1
        d.setDate(d.getDate() - 1)
      }

      const evaluated = evaluateAchievements({
        today,
        cards,
        dailyStats,
        kanji: kanjiData,
        currentStreak: streak,
      })
      setAchievements(evaluated)
      setLoading(false)
    }

    void compute()
    return () => { cancelled = true }
  }, [kanjiData])

  return { achievements, loading }
}
