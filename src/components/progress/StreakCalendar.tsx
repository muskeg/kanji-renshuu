import { useMemo } from 'react'
import styles from './StreakCalendar.module.css'

interface StreakCalendarProps {
  dailyActivity: { date: string; count: number }[]
}

function getColorLevel(count: number): string {
  if (count === 0) return styles.level0
  if (count <= 4) return styles.level1
  if (count <= 9) return styles.level2
  if (count <= 19) return styles.level3
  return styles.level4
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['', 'M', '', 'W', '', 'F', '']

export function StreakCalendar({ dailyActivity }: StreakCalendarProps) {
  const { weeks, monthLabels } = useMemo(() => {
    const activityMap = new Map(dailyActivity.map(a => [a.date, a.count]))

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Go back 364 days to get 365 total days
    const start = new Date(today)
    start.setDate(start.getDate() - 364)

    // Adjust start to Sunday
    const startDay = start.getDay()
    if (startDay !== 0) {
      start.setDate(start.getDate() - startDay)
    }

    const weeks: { date: string; count: number; dayOfWeek: number }[][] = []
    const monthLabels: { label: string; weekIndex: number }[] = []
    let currentWeek: { date: string; count: number; dayOfWeek: number }[] = []
    let lastMonth = -1

    const d = new Date(start)
    let weekIndex = 0

    while (d <= today) {
      const dateStr = d.toISOString().split('T')[0]
      const month = d.getMonth()

      if (month !== lastMonth && d.getDay() === 0) {
        monthLabels.push({ label: MONTHS[month], weekIndex })
        lastMonth = month
      }

      currentWeek.push({
        date: dateStr,
        count: activityMap.get(dateStr) ?? 0,
        dayOfWeek: d.getDay(),
      })

      if (d.getDay() === 6) {
        weeks.push(currentWeek)
        currentWeek = []
        weekIndex++
      }

      d.setDate(d.getDate() + 1)
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek)
    }

    return { weeks, monthLabels }
  }, [dailyActivity])

  return (
    <div className={styles.container}>
      <div className={styles.scrollWrapper}>
        <div className={styles.labels}>
          {DAYS.map((label, i) => (
            <span key={i} className={styles.dayLabel}>{label}</span>
          ))}
        </div>
        <div className={styles.grid}>
          <div className={styles.monthRow}>
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className={styles.monthLabel}
                style={{ gridColumnStart: m.weekIndex + 1 }}
              >
                {m.label}
              </span>
            ))}
          </div>
          <div className={styles.cells}>
            {weeks.map((week, wi) => (
              <div key={wi} className={styles.column}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`${styles.cell} ${getColorLevel(day.count)}`}
                    title={`${day.date}: ${day.count} reviews`}
                    style={{ gridRow: day.dayOfWeek + 1 }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
