import type { KanjiEntry } from './types'
import { getAllCardStates, getAllDailyStats, todayDateString } from '@/core/storage/db'
import { t } from '@/i18n'

export interface MilestoneEvent {
  id: string
  title: string
  body: string
  icon: string
}

export interface AchievementDefinition {
  id: string
  title: string
  description: string
  icon: string
  category: 'kanji' | 'grade' | 'streak'
}

export interface AchievementStatus extends AchievementDefinition {
  earned: boolean
  dateEarned: string | null
  progress: number
  target: number
}

const MILESTONES_KEY = 'kanji-renshuu-triggered-milestones'
const MILESTONES_DATES_KEY = 'kanji-renshuu-milestone-dates'

const KANJI_MILESTONES = [
  { count: 10, titleKey: 'milestone.kanji10.title', bodyKey: 'milestone.kanji10.body' },
  { count: 50, titleKey: 'milestone.kanji50.title', bodyKey: 'milestone.kanji50.body' },
  { count: 100, titleKey: 'milestone.kanji100.title', bodyKey: 'milestone.kanji100.body' },
  { count: 200, titleKey: 'milestone.kanji200.title', bodyKey: 'milestone.kanji200.body' },
  { count: 500, titleKey: 'milestone.kanji500.title', bodyKey: 'milestone.kanji500.body' },
  { count: 1000, titleKey: 'milestone.kanji1000.title', bodyKey: 'milestone.kanji1000.body' },
  { count: 2136, titleKey: 'milestone.kanji2136.title', bodyKey: 'milestone.kanji2136.body' },
] as const

const STREAK_MILESTONES = [
  { days: 7, titleKey: 'milestone.streak7.title', bodyKey: 'milestone.streak7.body' },
  { days: 30, titleKey: 'milestone.streak30.title', bodyKey: 'milestone.streak30.body' },
  { days: 100, titleKey: 'milestone.streak100.title', bodyKey: 'milestone.streak100.body' },
  { days: 365, titleKey: 'milestone.streak365.title', bodyKey: 'milestone.streak365.body' },
] as const

export function getAchievementDefinitions(): AchievementDefinition[] {
  return [
    ...KANJI_MILESTONES.map(m => ({
      id: `kanji-${m.count}`,
      title: t(m.titleKey as 'milestone.kanji10.title').replace('!', ''),
      description: t(m.bodyKey as 'milestone.kanji10.body'),
      icon: '🎉',
      category: 'kanji' as const,
    })),
    ...[1, 2, 3, 4, 5, 6].map(grade => ({
      id: `grade-${grade}`,
      title: t('milestone.gradeCompleteAchievement', { grade }),
      description: t('milestone.gradeCompleteDesc', { grade }),
      icon: '🏆',
      category: 'grade' as const,
    })),
    ...STREAK_MILESTONES.map(m => ({
      id: `streak-${m.days}`,
      title: t(m.titleKey as 'milestone.streak7.title').replace('!', ''),
      description: t(m.bodyKey as 'milestone.streak7.body'),
      icon: '🔥',
      category: 'streak' as const,
    })),
  ]
}

function getTriggeredMilestones(): Set<string> {
  try {
    const raw = localStorage.getItem(MILESTONES_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((v): v is string => typeof v === 'string'))
  } catch {
    return new Set()
  }
}

function saveTriggeredMilestones(milestones: Set<string>): void {
  localStorage.setItem(MILESTONES_KEY, JSON.stringify([...milestones]))
}

function getMilestoneDates(): Map<string, string> {
  try {
    const raw = localStorage.getItem(MILESTONES_DATES_KEY)
    if (!raw) return new Map()
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return new Map()
    const map = new Map<string, string>()
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'string') map.set(k, v)
    }
    return map
  } catch {
    return new Map()
  }
}

function saveMilestoneDates(dates: Map<string, string>): void {
  localStorage.setItem(MILESTONES_DATES_KEY, JSON.stringify(Object.fromEntries(dates)))
}

export function getEarnedDates(): Map<string, string> {
  return getMilestoneDates()
}

/** Check for newly crossed milestones after a review session */
export async function checkMilestones(kanjiData: KanjiEntry[]): Promise<MilestoneEvent[]> {
  const triggered = getTriggeredMilestones()
  const events: MilestoneEvent[] = []

  const cards = await getAllCardStates()
  const introducedCards = cards.filter(c => c.introduced)
  const totalIntroduced = introducedCards.length

  // Kanji count milestones
  for (const m of KANJI_MILESTONES) {
    const id = `kanji-${m.count}`
    if (!triggered.has(id) && totalIntroduced >= m.count) {
      events.push({ id, title: t(m.titleKey as 'milestone.kanji10.title'), body: t(m.bodyKey as 'milestone.kanji10.body'), icon: '🎉' })
    }
  }

  // Grade completion milestones (grades 1–6)
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

  for (const [grade, total] of gradeCounts) {
    if (grade > 6) continue // Only grades 1–6
    const id = `grade-${grade}`
    if (!triggered.has(id) && (introducedByGrade.get(grade) ?? 0) >= total) {
      events.push({
        id,
        title: t('milestone.gradeComplete.title', { grade }),
        body: t('milestone.gradeComplete.body', { total }),
        icon: '🏆',
      })
    }
  }

  // Streak milestones
  const allStats = await getAllDailyStats()
  const statsSet = new Set(
    allStats
      .filter(s => s.reviewsCompleted > 0)
      .map(s => s.date),
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

  for (const m of STREAK_MILESTONES) {
    const id = `streak-${m.days}`
    if (!triggered.has(id) && streak >= m.days) {
      events.push({ id, title: t(m.titleKey as 'milestone.streak7.title'), body: t(m.bodyKey as 'milestone.streak7.body'), icon: '🔥' })
    }
  }

  // Persist triggered milestones with dates
  if (events.length > 0) {
    const dates = getMilestoneDates()
    for (const event of events) {
      triggered.add(event.id)
      if (!dates.has(event.id)) {
        dates.set(event.id, today)
      }
    }
    saveTriggeredMilestones(triggered)
    saveMilestoneDates(dates)
  }

  return events
}
