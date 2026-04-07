import { useState, useEffect, useCallback } from 'react'
import { getAllCardStates, getDailyStats, getAllDailyStats, todayDateString } from '@/core/storage/db'
import { loadSettings } from '@/core/storage/settings'

interface QueueStats {
  dueCount: number
  newToday: number
  newLimit: number
  currentStreak: number
  activatedToday: boolean
}

export function useQueueStats() {
  const [stats, setStats] = useState<QueueStats>({
    dueCount: 0,
    newToday: 0,
    newLimit: 10,
    currentStreak: 0,
    activatedToday: false,
  })

  const refresh = useCallback(async () => {
    const now = new Date()
    const today = todayDateString()
    const settings = loadSettings()

    const [cards, todayStats, allStats] = await Promise.all([
      getAllCardStates(),
      getDailyStats(today),
      getAllDailyStats(),
    ])

    // Count due cards
    let dueCount = 0
    for (const card of cards) {
      if (card.introduced && new Date(card.fsrsCard.due) <= now) {
        dueCount++
      }
    }

    // Current streak: consecutive days with reviews starting from today/yesterday
    const statsSet = new Set(
      allStats
        .filter(s => s.reviewsCompleted > 0)
        .map(s => s.date),
    )

    let streak = 0
    const d = new Date()
    // Check if user has reviewed today first
    const activatedToday = statsSet.has(today)
    if (!activatedToday) {
      // Start from yesterday
      d.setDate(d.getDate() - 1)
    }

    while (true) {
      const dateStr = d.toISOString().split('T')[0]!
      if (statsSet.has(dateStr)) {
        streak++
        d.setDate(d.getDate() - 1)
      } else {
        break
      }
    }

    setStats({
      dueCount,
      newToday: todayStats?.newCardsIntroduced ?? 0,
      newLimit: settings.dailyNewCards,
      currentStreak: streak,
      activatedToday,
    })
  }, [])

  useEffect(() => {
    refresh()

    // Re-query when tab becomes visible
    function handleVisibility() {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [refresh])

  return { ...stats, refresh }
}
