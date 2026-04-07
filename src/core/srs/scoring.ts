import type { SessionSummaryData } from './types'

const SCORES_KEY = 'kanji-renshuu-scores'

export interface SessionScore {
  base: number
  accuracyBonus: number
  speedBonus: number
  streakMultiplier: number
  total: number
}

export interface ScoreRecord {
  dailyBest: number
  dailyBestDate: string
  allTimeBest: number
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]!
}

function loadScores(): ScoreRecord {
  try {
    const raw = localStorage.getItem(SCORES_KEY)
    if (!raw) return { dailyBest: 0, dailyBestDate: '', allTimeBest: 0 }
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return { dailyBest: 0, dailyBestDate: '', allTimeBest: 0 }
    return parsed as ScoreRecord
  } catch {
    return { dailyBest: 0, dailyBestDate: '', allTimeBest: 0 }
  }
}

function saveScores(record: ScoreRecord): void {
  localStorage.setItem(SCORES_KEY, JSON.stringify(record))
}

/** Compute a session score based on performance */
export function computeSessionScore(
  summary: SessionSummaryData,
  currentStreak: number,
): SessionScore {
  const cards = summary.totalReviewed
  const accuracy = cards > 0 ? summary.correctCount / cards : 0
  const avgTimeMs = cards > 0 ? summary.totalTimeMs / cards : 10000

  // Base: 10 per card
  const base = cards * 10

  // Accuracy bonus: base × accuracy
  const accuracyBonus = Math.round(base * accuracy)

  // Speed bonus: average response time under thresholds
  const avgTimeSec = avgTimeMs / 1000
  let speedBonus = 0
  if (avgTimeSec < 3) speedBonus = 200
  else if (avgTimeSec < 5) speedBonus = 100
  else if (avgTimeSec < 8) speedBonus = 50

  // Streak multiplier: 1 + (streak × 0.1), capped at 3.0
  const streakMultiplier = Math.min(3, 1 + currentStreak * 0.1)

  const subtotal = base + accuracyBonus + speedBonus
  const total = Math.round(subtotal * streakMultiplier)

  return { base, accuracyBonus, speedBonus, streakMultiplier, total }
}

/** Record a score and return whether it's a new personal best */
export function recordScore(score: number): { isPersonalBest: boolean; previousBest: number } {
  const record = loadScores()
  const today = todayStr()

  // Reset daily best if it's a new day
  if (record.dailyBestDate !== today) {
    record.dailyBest = 0
    record.dailyBestDate = today
  }

  const previousBest = record.allTimeBest
  const isPersonalBest = score > record.allTimeBest

  if (score > record.dailyBest) {
    record.dailyBest = score
    record.dailyBestDate = today
  }
  if (isPersonalBest) {
    record.allTimeBest = score
  }

  saveScores(record)
  return { isPersonalBest, previousBest }
}
