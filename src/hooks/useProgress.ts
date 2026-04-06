import { useState, useEffect } from 'react'
import type { KanjiEntry } from '@/core/srs/types'
import { getAllCardStates, getAllDailyStats, todayDateString } from '@/core/storage/db'

export interface ProgressData {
  todayReviews: number
  todayCorrect: number
  todayNewCards: number
  todayTimeMs: number
  currentStreak: number
  longestStreak: number
  totalKanji: number
  introduced: number
  notStarted: number
  gradeProgress: { grade: number; total: number; introduced: number }[]
  jlptProgress: { level: number; total: number; introduced: number }[]
  dailyActivity: { date: string; count: number }[]
  retentionRate: number
  loading: boolean
}

const INITIAL: ProgressData = {
  todayReviews: 0,
  todayCorrect: 0,
  todayNewCards: 0,
  todayTimeMs: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalKanji: 0,
  introduced: 0,
  notStarted: 0,
  gradeProgress: [],
  jlptProgress: [],
  dailyActivity: [],
  retentionRate: 0,
  loading: true,
}

export function useProgress(kanjiData: KanjiEntry[]): ProgressData {
  const [data, setData] = useState<ProgressData>(INITIAL)

  useEffect(() => {
    let cancelled = false

    async function compute() {
      const [cardStates, allStats] = await Promise.all([
        getAllCardStates(),
        getAllDailyStats(),
      ])

      if (cancelled) return

      const today = todayDateString()
      const todayStats = allStats.find(s => s.date === today)

      // Streak calculation
      const sortedDates = allStats
        .filter(s => s.reviewsCompleted > 0)
        .map(s => s.date)
        .sort()
        .reverse()

      let currentStreak = 0
      let longestStreak = 0
      if (sortedDates.length > 0) {
        // Check if today or yesterday is in the list to start the streak
        const todayDate = new Date(today)
        const yesterdayDate = new Date(todayDate)
        yesterdayDate.setDate(yesterdayDate.getDate() - 1)
        const yesterdayStr = yesterdayDate.toISOString().split('T')[0]

        const dateSet = new Set(sortedDates)
        if (dateSet.has(today) || dateSet.has(yesterdayStr)) {
          const startDate = dateSet.has(today) ? todayDate : yesterdayDate
          let d = new Date(startDate)
          while (dateSet.has(d.toISOString().split('T')[0])) {
            currentStreak++
            d.setDate(d.getDate() - 1)
          }
        }

        // Longest streak
        const allDatesAsc = [...sortedDates].sort()
        let streak = 1
        for (let i = 1; i < allDatesAsc.length; i++) {
          const prev = new Date(allDatesAsc[i - 1])
          const curr = new Date(allDatesAsc[i])
          const diffDays = (curr.getTime() - prev.getTime()) / 86400000
          if (diffDays === 1) {
            streak++
          } else {
            longestStreak = Math.max(longestStreak, streak)
            streak = 1
          }
        }
        longestStreak = Math.max(longestStreak, streak)
      }

      // Retention rate (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const thirtyDaysStr = thirtyDaysAgo.toISOString().split('T')[0]
      const recentStats = allStats.filter(s => s.date >= thirtyDaysStr)
      const totalReviews30d = recentStats.reduce((sum, s) => sum + s.reviewsCompleted, 0)
      const totalCorrect30d = recentStats.reduce((sum, s) => sum + s.correctCount, 0)
      const retentionRate = totalReviews30d > 0 ? totalCorrect30d / totalReviews30d : 0

      // Cards by state
      const introducedSet = new Set(cardStates.filter(c => c.introduced).map(c => c.kanjiLiteral))
      const introduced = introducedSet.size
      const totalKanji = kanjiData.length
      const notStarted = totalKanji - introduced

      // Grade progress
      const gradeMap = new Map<number, { total: number; introduced: number }>()
      for (const k of kanjiData) {
        const entry = gradeMap.get(k.grade) ?? { total: 0, introduced: 0 }
        entry.total++
        if (introducedSet.has(k.literal)) entry.introduced++
        gradeMap.set(k.grade, entry)
      }
      const gradeProgress = [...gradeMap.entries()]
        .map(([grade, { total, introduced }]) => ({ grade, total, introduced }))
        .sort((a, b) => a.grade - b.grade)

      // JLPT progress
      const jlptMap = new Map<number, { total: number; introduced: number }>()
      for (const k of kanjiData) {
        if (k.jlpt === null) continue
        const entry = jlptMap.get(k.jlpt) ?? { total: 0, introduced: 0 }
        entry.total++
        if (introducedSet.has(k.literal)) entry.introduced++
        jlptMap.set(k.jlpt, entry)
      }
      const jlptProgress = [...jlptMap.entries()]
        .map(([level, { total, introduced }]) => ({ level, total, introduced }))
        .sort((a, b) => b.level - a.level) // N5 first (5, 4, 3, 2, 1)

      // Daily activity
      const dailyActivity = allStats.map(s => ({ date: s.date, count: s.reviewsCompleted }))

      if (!cancelled) {
        setData({
          todayReviews: todayStats?.reviewsCompleted ?? 0,
          todayCorrect: todayStats?.correctCount ?? 0,
          todayNewCards: todayStats?.newCardsIntroduced ?? 0,
          todayTimeMs: todayStats?.totalTimeMs ?? 0,
          currentStreak,
          longestStreak,
          totalKanji,
          introduced,
          notStarted,
          gradeProgress,
          jlptProgress,
          dailyActivity,
          retentionRate,
          loading: false,
        })
      }
    }

    compute()
    return () => { cancelled = true }
  }, [kanjiData])

  return data
}
