import { useEffect, useState, useCallback } from 'react'
import type { UserStats } from '@/core/srs/types'
import { getUserStats } from '@/core/storage/db'
import { USER_STATS_EVENT } from '@/core/gamification/xp'

/**
 * Subscribes to the persisted gamification stats. Listens to the
 * `USER_STATS_EVENT` window event so any in-app XP/freeze mutation is
 * reflected immediately in every consumer.
 */
export function useUserStats(): { stats: UserStats | null; refresh: () => void } {
  const [stats, setStats] = useState<UserStats | null>(null)

  const refresh = useCallback(() => {
    void getUserStats().then(setStats)
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener(USER_STATS_EVENT, refresh)
    return () => window.removeEventListener(USER_STATS_EVENT, refresh)
  }, [refresh])

  return { stats, refresh }
}
