import { useState, useEffect, useCallback } from 'react'
import { getAllCardStates, getDailyStats, getAllDailyStats, todayDateString } from '@/core/storage/db'
import { loadSettings } from '@/core/storage/settings'

interface QueueStats {
  dueCount: number
  newToday: number
  newLimit: number
  currentStreak: number
  activatedToday: boolean
  nextDueDate: Date | null
}

async function fetchQueueStats(): Promise<QueueStats> {
  const now = new Date()
  const today = todayDateString()
  const settings = loadSettings()

  const [cards, todayStats, allStats] = await Promise.all([
    getAllCardStates(),
    getDailyStats(today),
    getAllDailyStats(),
  ])

  // Count due cards and find next due date
  let dueCount = 0
  let nextDueDate: Date | null = null
  for (const card of cards) {
    if (card.introduced) {
      const due = new Date(card.fsrsCard.due)
      if (due <= now) {
        dueCount++
      } else if (!nextDueDate || due < nextDueDate) {
        nextDueDate = due
      }
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
  const activatedToday = statsSet.has(today)
  if (!activatedToday) {
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

  return {
    dueCount,
    newToday: todayStats?.newCardsIntroduced ?? 0,
    newLimit: settings.dailyNewCards,
    currentStreak: streak,
    activatedToday,
    nextDueDate,
  }
}

export function useQueueStats() {
  const [stats, setStats] = useState<QueueStats>({
    dueCount: 0,
    newToday: 0,
    newLimit: 10,
    currentStreak: 0,
    activatedToday: false,
    nextDueDate: null,
  })

  const refresh = useCallback(() => {
    fetchQueueStats().then(setStats)
  }, [])

  useEffect(() => {
    fetchQueueStats().then(setStats)

    // Re-query when tab becomes visible
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        fetchQueueStats().then(setStats)
      }
    }

    // Re-query after any review/quiz session completes
    function handleReviewComplete() {
      fetchQueueStats().then(setStats)
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('kanji-review-complete', handleReviewComplete)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('kanji-review-complete', handleReviewComplete)
    }
  }, [])

  return { ...stats, refresh }
}
