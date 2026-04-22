/**
 * Streak computation with optional freeze tokens.
 *
 * A "streak" is a contiguous run of days where the user either reviewed at
 * least one card or burned a freeze token to protect the day. The current
 * streak is anchored at today (or yesterday if today has no activity yet).
 */

const DAY_MS = 86_400_000

function toDate(iso: string): Date {
  // Parse as UTC midnight so day arithmetic is unaffected by local time zones.
  return new Date(iso + 'T00:00:00Z')
}

function shiftDay(iso: string, deltaDays: number): string {
  const d = toDate(iso)
  d.setUTCDate(d.getUTCDate() + deltaDays)
  return d.toISOString().split('T')[0]!
}

export interface StreakComputation {
  /** Days in the active streak ending today/yesterday. */
  current: number
  /** Longest contiguous run anywhere in history. */
  longest: number
  /**
   * Number of *additional* freeze tokens that should be auto-spent to keep the
   * streak alive (gaps between activity days that the caller hasn't burned
   * yet). Caller is responsible for decrementing the user's freeze pool and
   * recording the protected dates.
   */
  freezesNeeded: string[]
}

/**
 * Compute a streak from a list of active dates (those with ≥1 review) plus an
 * existing set of dates already protected by freezes and a count of freezes
 * still available to spend on new gaps.
 */
export function computeStreakWithFreezes(
  activeDates: Iterable<string>,
  frozenDates: Iterable<string>,
  freezesAvailable: number,
  today: string,
): StreakComputation {
  const active = new Set<string>([...activeDates, ...frozenDates])
  const yesterday = shiftDay(today, -1)

  // No anchor → no streak.
  if (!active.has(today) && !active.has(yesterday)) {
    return { current: 0, longest: longestRun(active), freezesNeeded: [] }
  }

  let cursor = active.has(today) ? today : yesterday
  let current = 0
  const freezesNeeded: string[] = []
  let budget = freezesAvailable

  // Walk back day-by-day. Burn a freeze for any single-day gap if budget > 0.
  while (true) {
    if (active.has(cursor)) {
      current += 1
      cursor = shiftDay(cursor, -1)
      continue
    }
    if (budget > 0) {
      budget -= 1
      freezesNeeded.push(cursor)
      // The freeze keeps the gap day "active" — count it and continue back.
      current += 1
      cursor = shiftDay(cursor, -1)
      continue
    }
    break
  }

  return { current, longest: Math.max(current, longestRun(active)), freezesNeeded }
}

/**
 * Length of the longest contiguous run anywhere in the given set of active
 * dates (no freeze accounting — purely descriptive).
 */
export function longestRun(activeDates: Set<string>): number {
  if (activeDates.size === 0) return 0
  const sorted = [...activeDates].sort()
  let longest = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    const diff = (toDate(sorted[i]!).getTime() - toDate(sorted[i - 1]!).getTime()) / DAY_MS
    if (diff === 1) {
      run += 1
      longest = Math.max(longest, run)
    } else if (diff > 1) {
      run = 1
    }
  }
  return longest
}

/** Award a freeze if today crossed a 7-day milestone. Returns true if awarded. */
export function shouldAwardFreeze(currentStreak: number, currentFreezes: number): boolean {
  if (currentStreak <= 0 || currentStreak % 7 !== 0) return false
  return currentFreezes < MAX_FREEZES
}

export const MAX_FREEZES = 3
