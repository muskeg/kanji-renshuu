import type { CardState } from './types'

export interface ForecastDay {
  date: string
  label: string
  dueCount: number
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** Compute a 7-day review forecast from card due dates */
export function computeForecast(cards: CardState[], days = 7): ForecastDay[] {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const forecast: ForecastDay[] = []

  for (let i = 1; i <= days; i++) {
    const dayStart = new Date(todayStart)
    dayStart.setDate(dayStart.getDate() + i)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const dateStr = dayStart.toISOString().split('T')[0]!
    const label = i === 1 ? 'Tomorrow' : DAY_NAMES[dayStart.getDay()]!

    let dueCount = 0
    for (const card of cards) {
      if (!card.introduced) continue
      const due = new Date(card.fsrsCard.due)
      // Count cards whose due date falls within this day
      if (due >= dayStart && due < dayEnd) {
        dueCount++
      }
    }

    forecast.push({ date: dateStr, label, dueCount })
  }

  return forecast
}
