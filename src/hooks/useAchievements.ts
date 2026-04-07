import { useState, useEffect } from 'react'
import type { KanjiEntry } from '@/core/srs/types'
import type { AchievementStatus } from '@/core/srs/milestones'
import { ACHIEVEMENT_DEFINITIONS, getEarnedDates } from '@/core/srs/milestones'
import { getAllCardStates, getAllDailyStats, todayDateString } from '@/core/storage/db'

export function useAchievements(kanjiData: KanjiEntry[]): {
  achievements: AchievementStatus[]
  loading: boolean
} {
  const [achievements, setAchievements] = useState<AchievementStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function compute() {
      const [cardStates, allStats] = await Promise.all([
        getAllCardStates(),
        getAllDailyStats(),
      ])

      if (cancelled) return

      const earnedDates = getEarnedDates()
      const introducedCards = cardStates.filter(c => c.introduced)
      const totalIntroduced = introducedCards.length

      // Grade progress
      const kanjiByLiteral = new Map<string, KanjiEntry>()
      const gradeCounts = new Map<number, number>()
      for (const k of kanjiData) {
        kanjiByLiteral.set(k.literal, k)
        gradeCounts.set(k.grade, (gradeCounts.get(k.grade) ?? 0) + 1)
      }
      const introducedByGrade = new Map<number, number>()
      for (const card of introducedCards) {
        const kanji = kanjiByLiteral.get(card.kanjiLiteral)
        if (kanji) {
          introducedByGrade.set(kanji.grade, (introducedByGrade.get(kanji.grade) ?? 0) + 1)
        }
      }

      // Streak
      const statsSet = new Set(
        allStats.filter(s => s.reviewsCompleted > 0).map(s => s.date),
      )
      const today = todayDateString()
      let streak = 0
      const d = new Date()
      if (!statsSet.has(today)) {
        d.setDate(d.getDate() - 1)
      }
      while (statsSet.has(d.toISOString().split('T')[0]!)) {
        streak++
        d.setDate(d.getDate() - 1)
      }

      const result: AchievementStatus[] = ACHIEVEMENT_DEFINITIONS.map(def => {
        const dateEarned = earnedDates.get(def.id) ?? null
        const earned = dateEarned !== null

        let progress = 0
        let target = 1

        if (def.category === 'kanji') {
          const count = Number(def.id.replace('kanji-', ''))
          target = count
          progress = Math.min(totalIntroduced, target)
        } else if (def.category === 'grade') {
          const grade = Number(def.id.replace('grade-', ''))
          target = gradeCounts.get(grade) ?? 0
          progress = Math.min(introducedByGrade.get(grade) ?? 0, target)
        } else if (def.category === 'streak') {
          const days = Number(def.id.replace('streak-', ''))
          target = days
          progress = Math.min(streak, target)
        }

        return { ...def, earned, dateEarned, progress, target }
      })

      setAchievements(result)
      setLoading(false)
    }

    compute()
    return () => { cancelled = true }
  }, [kanjiData])

  return { achievements, loading }
}
