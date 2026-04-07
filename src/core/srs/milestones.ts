import type { KanjiEntry } from './types'
import { getAllCardStates, getAllDailyStats, todayDateString } from '@/core/storage/db'

export interface MilestoneEvent {
  id: string
  title: string
  body: string
  icon: string
}

const MILESTONES_KEY = 'kanji-renshuu-triggered-milestones'

const KANJI_MILESTONES = [
  { count: 10, title: 'First 10 kanji!', body: "You're on your way." },
  { count: 50, title: '50 kanji learned!', body: 'Building a strong foundation.' },
  { count: 100, title: '100 kanji learned!', body: "You're making great progress!" },
  { count: 200, title: '200 kanji learned!', body: 'Impressive dedication!' },
  { count: 500, title: '500 kanji learned!', body: "You're reading more every day!" },
  { count: 1000, title: '1,000 kanji learned!', body: 'Halfway to Jōyō mastery!' },
  { count: 2136, title: 'All 2,136 Jōyō kanji!', body: 'You did it — complete mastery!' },
] as const

const STREAK_MILESTONES = [
  { days: 7, title: '7-day streak!', body: 'Consistency is key.' },
  { days: 30, title: '30-day streak!', body: 'Incredible dedication!' },
  { days: 100, title: '100-day streak!', body: "You're unstoppable." },
  { days: 365, title: 'One full year!', body: '365 days of daily practice!' },
] as const

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
      events.push({ id, title: m.title, body: m.body, icon: '🎉' })
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
        title: `Grade ${grade} complete!`,
        body: `${total} kanji mastered!`,
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
      events.push({ id, title: m.title, body: m.body, icon: '🔥' })
    }
  }

  // Persist triggered milestones
  if (events.length > 0) {
    for (const event of events) {
      triggered.add(event.id)
    }
    saveTriggeredMilestones(triggered)
  }

  return events
}
