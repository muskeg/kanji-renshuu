const STORAGE_KEY = 'kanji-renshuu-streak-freeze'

interface StreakFreezeData {
  available: number
  usedDates: string[]
  lastBrokenStreak: number | null
  lastBrokenDate: string | null
}

function load(): StreakFreezeData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StreakFreezeData
  } catch { /* use defaults */ }
  return { available: 0, usedDates: [], lastBrokenStreak: null, lastBrokenDate: null }
}

function save(data: StreakFreezeData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/** Award a freeze for every 7-day streak milestone reached */
export function checkFreezeReward(currentStreak: number): boolean {
  if (currentStreak <= 0 || currentStreak % 7 !== 0) return false

  const key = `kanji-renshuu-freeze-awarded-${currentStreak}`
  if (localStorage.getItem(key)) return false

  const data = load()
  data.available = Math.min(data.available + 1, 3) // Max 3 banked
  save(data)
  localStorage.setItem(key, '1')
  return true
}

/** Try to use a freeze to protect a missed day. Returns the date frozen, or null. */
export function tryAutoFreeze(
  missedDate: string,
): string | null {
  const data = load()

  // Already frozen this date
  if (data.usedDates.includes(missedDate)) return missedDate

  // No freeze available or user already reviewed today (no need)
  if (data.available <= 0) return null

  data.available--
  data.usedDates.push(missedDate)
  save(data)
  return missedDate
}

/** Record a broken streak */
export function recordBrokenStreak(streak: number): void {
  const data = load()
  data.lastBrokenStreak = streak
  data.lastBrokenDate = new Date().toISOString().split('T')[0]!
  save(data)
}

/** Get broken streak info if recent (within 7 days) and not yet dismissed */
export function getBrokenStreak(): { streak: number; date: string } | null {
  const data = load()
  if (!data.lastBrokenStreak || !data.lastBrokenDate) return null

  const dismissKey = `kanji-renshuu-streak-dismiss-${data.lastBrokenDate}`
  if (localStorage.getItem(dismissKey)) return null

  // Only show within 7 days
  const daysSince = Math.floor(
    (Date.now() - new Date(data.lastBrokenDate + 'T00:00:00').getTime()) / 86400000,
  )
  if (daysSince > 7) return null

  return { streak: data.lastBrokenStreak, date: data.lastBrokenDate }
}

/** Dismiss the broken streak prompt */
export function dismissBrokenStreak(): void {
  const data = load()
  if (data.lastBrokenDate) {
    localStorage.setItem(`kanji-renshuu-streak-dismiss-${data.lastBrokenDate}`, '1')
  }
}

/** Get the set of dates where a freeze was used (for heatmap display) */
export function getFrozenDates(): Set<string> {
  return new Set(load().usedDates)
}

/** Get available freezes count */
export function getAvailableFreezes(): number {
  return load().available
}
