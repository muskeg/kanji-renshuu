import type { CardState, DailyStats, KanjiEntry } from '@/core/srs/types'

/** Five families used to group achievements in the gallery. */
export type AchievementFamily =
  | 'milestones'
  | 'mastery'
  | 'skill'
  | 'persistence'
  | 'exploration'

/**
 * Snapshot of derived statistics passed to every achievement predicate.
 * Predicates are pure: same input → same output. Persisted unlock state is
 * tracked separately via `loadUnlocks` / `saveUnlocks`.
 */
export interface AchievementStats {
  /** Today's date in `YYYY-MM-DD`. */
  today: string
  /** All card states (introduced + new). */
  cards: CardState[]
  /** All daily stats records. */
  dailyStats: DailyStats[]
  /** All known kanji (for grade lookups). */
  kanji: KanjiEntry[]
  /** Current consecutive streak (already accounting for freezes). */
  currentStreak: number
}

export interface AchievementDef {
  id: string
  family: AchievementFamily
  titleKey: string
  descriptionKey: string
  icon: string
  /** Returns `progress` in [0, 1]. 1 means unlocked. */
  predicate: (stats: AchievementStats) => number
}

export interface EvaluatedAchievement extends AchievementDef {
  progress: number
  unlocked: boolean
  unlockedAt: string | null
}

const UNLOCK_STORAGE_KEY = 'kanji-renshuu-achievement-unlocks'

interface UnlockMap {
  [achievementId: string]: string
}

export function loadUnlocks(): UnlockMap {
  try {
    const raw = localStorage.getItem(UNLOCK_STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    const out: UnlockMap = {}
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'string') out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

function saveUnlocks(map: UnlockMap): void {
  localStorage.setItem(UNLOCK_STORAGE_KEY, JSON.stringify(map))
}

// --- Predicate helpers (pure) ----------------------------------------------

function introducedCount(s: AchievementStats): number {
  return s.cards.filter(c => c.introduced).length
}

function gradesCovered(s: AchievementStats): Set<number> {
  const literalToGrade = new Map<string, number>()
  for (const k of s.kanji) literalToGrade.set(k.literal, k.grade)
  const grades = new Set<number>()
  for (const c of s.cards) {
    if (!c.introduced) continue
    const g = literalToGrade.get(c.kanjiLiteral)
    if (g !== undefined) grades.add(g)
  }
  return grades
}

function masteredCount(s: AchievementStats): number {
  // FSRS state: 0 = New, 1 = Learning, 2 = Review, 3 = Relearning.
  // We treat any card that has reached the Review state at least once
  // (state === 2) as "mastered" for the purposes of this achievement.
  return s.cards.filter(c => c.introduced && c.fsrsCard.state === 2).length
}

function recentAccuracy(s: AchievementStats, lastDays: number): number {
  // Look at the most recent N days of activity.
  const sorted = [...s.dailyStats]
    .filter(d => d.reviewsCompleted > 0)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, lastDays)
  const totalReviews = sorted.reduce((sum, d) => sum + d.reviewsCompleted, 0)
  if (totalReviews === 0) return 0
  const totalCorrect = sorted.reduce((sum, d) => sum + d.correctCount, 0)
  return totalCorrect / totalReviews
}

// --- Declarative rules -----------------------------------------------------

const KANJI_THRESHOLDS = [10, 50, 100, 200, 500, 1000, 1500, 2136] as const

function kanjiMilestoneRules(): AchievementDef[] {
  return KANJI_THRESHOLDS.map(n => ({
    id: `milestones.kanji-${n}`,
    family: 'milestones' as const,
    titleKey: `achievement.kanji${n}.title`,
    descriptionKey: `achievement.kanji${n}.desc`,
    icon: '🎉',
    predicate: (s) => Math.min(1, introducedCount(s) / n),
  }))
}

const STREAK_THRESHOLDS = [7, 30, 50, 100, 365] as const

function streakRules(): AchievementDef[] {
  return STREAK_THRESHOLDS.map(days => ({
    id: `persistence.streak-${days}`,
    family: 'persistence' as const,
    titleKey: `achievement.streak${days}.title`,
    descriptionKey: `achievement.streak${days}.desc`,
    icon: '🔥',
    predicate: (s) => Math.min(1, s.currentStreak / days),
  }))
}

const GRADES = [1, 2, 3, 4, 5, 6] as const

function gradeCompletionRules(): AchievementDef[] {
  return GRADES.map(grade => ({
    id: `milestones.grade-${grade}`,
    family: 'milestones' as const,
    titleKey: `achievement.grade${grade}.title`,
    descriptionKey: `achievement.grade${grade}.desc`,
    icon: '🏆',
    predicate: (s) => {
      const total = s.kanji.filter(k => k.grade === grade).length
      if (total === 0) return 0
      const introducedThisGrade = s.cards
        .filter(c => c.introduced)
        .filter(c => s.kanji.find(k => k.literal === c.kanjiLiteral)?.grade === grade)
        .length
      return Math.min(1, introducedThisGrade / total)
    },
  }))
}

const NEW_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'mastery.cards-100',
    family: 'mastery',
    titleKey: 'achievement.master100.title',
    descriptionKey: 'achievement.master100.desc',
    icon: '🧠',
    predicate: (s) => Math.min(1, masteredCount(s) / 100),
  },
  {
    id: 'skill.accuracy-95',
    family: 'skill',
    titleKey: 'achievement.accuracy95.title',
    descriptionKey: 'achievement.accuracy95.desc',
    icon: '🎯',
    predicate: (s) => {
      // Need at least 100 reviews to count.
      const lastWeek = recentAccuracy(s, 7)
      // Predicate scales: 0 below 0.85, linear to 1.0 by 0.95.
      if (lastWeek <= 0.85) return 0
      if (lastWeek >= 0.95) return 1
      return (lastWeek - 0.85) / (0.95 - 0.85)
    },
  },
  {
    id: 'exploration.all-grades',
    family: 'exploration',
    titleKey: 'achievement.allGrades.title',
    descriptionKey: 'achievement.allGrades.desc',
    icon: '🗺️',
    predicate: (s) => {
      const seen = gradesCovered(s)
      // Grades 1–6 + 8 (secondary)
      const required = [1, 2, 3, 4, 5, 6, 8] as const
      const covered = required.filter(g => seen.has(g)).length
      return covered / required.length
    },
  },
]

/** Full declarative ruleset. Families collapse to a stable order. */
export function getAchievementRules(): AchievementDef[] {
  return [
    ...kanjiMilestoneRules(),
    ...gradeCompletionRules(),
    ...streakRules(),
    ...NEW_ACHIEVEMENTS,
  ]
}

/**
 * Evaluate every rule against the snapshot, persist newly-unlocked ones with
 * today's date, and return the full annotated list (sorted by family).
 */
export function evaluateAchievements(stats: AchievementStats): EvaluatedAchievement[] {
  const rules = getAchievementRules()
  const unlocks = loadUnlocks()
  let mutated = false

  const evaluated: EvaluatedAchievement[] = rules.map(def => {
    const progress = Math.max(0, Math.min(1, def.predicate(stats)))
    const wasUnlocked = unlocks[def.id] !== undefined
    const isUnlocked = progress >= 1
    if (isUnlocked && !wasUnlocked) {
      unlocks[def.id] = stats.today
      mutated = true
    }
    return {
      ...def,
      progress,
      unlocked: isUnlocked,
      unlockedAt: unlocks[def.id] ?? null,
    }
  })

  if (mutated) saveUnlocks(unlocks)
  return evaluated
}

export const FAMILY_ORDER: AchievementFamily[] = [
  'milestones',
  'mastery',
  'skill',
  'persistence',
  'exploration',
]
