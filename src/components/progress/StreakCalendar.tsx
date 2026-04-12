import { useMemo, useState } from 'react'
import { getFrozenDates } from '@/core/srs/streakFreeze'
import { useTranslation } from '@/i18n'
import styles from './StreakCalendar.module.css'

interface StreakCalendarProps {
  dailyActivity: { date: string; count: number; correct: number }[]
}

function getColorLevel(count: number): string {
  if (count === 0) return styles.level0
  if (count <= 4) return styles.level1
  if (count <= 9) return styles.level2
  if (count <= 19) return styles.level3
  return styles.level4
}

export function StreakCalendar({ dailyActivity }: StreakCalendarProps) {
  const [selected, setSelected] = useState<{ date: string; count: number; correct: number } | null>(null)
  const { t, locale } = useTranslation()

  const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-US'

  function formatTooltip(date: string, count: number, correct: number): string {
    const d = new Date(date + 'T00:00:00')
    const formatted = d.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' })
    if (count === 0) return `${formatted}\n${t('calendar.noReviews')}`
    const accuracy = Math.round((correct / count) * 100)
    return `${formatted}\n${t('calendar.reviewCount', { count })} · ${t('calendar.accuracyPct', { pct: accuracy })}`
  }

  const DAYS = ['', t('calendar.mon'), '', t('calendar.wed'), '', t('calendar.fri'), '']
  const { weeks, monthLabels } = useMemo(() => {
    const MONTHS = [
      t('calendar.jan'), t('calendar.feb'), t('calendar.mar'), t('calendar.apr'),
      t('calendar.may'), t('calendar.jun'), t('calendar.jul'), t('calendar.aug'),
      t('calendar.sep'), t('calendar.oct'), t('calendar.nov'), t('calendar.dec'),
    ]
    const activityMap = new Map(dailyActivity.map(a => [a.date, { count: a.count, correct: a.correct }]))
    const frozenDates = getFrozenDates()

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

    const todayStr = today.toISOString().split('T')[0]

    const weeks: { date: string; count: number; correct: number; dayOfWeek: number; frozen: boolean; isToday: boolean }[][] = []
    const monthLabels: { label: string; weekIndex: number }[] = []
    let currentWeek: { date: string; count: number; correct: number; dayOfWeek: number; frozen: boolean; isToday: boolean }[] = []
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

      const activity = activityMap.get(dateStr)
      currentWeek.push({
        date: dateStr,
        count: activity?.count ?? 0,
        correct: activity?.correct ?? 0,
        dayOfWeek: d.getDay(),
        frozen: frozenDates.has(dateStr),
        isToday: dateStr === todayStr,
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
  }, [dailyActivity, t])

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
                    className={`${styles.cell} ${day.frozen ? styles.frozen : getColorLevel(day.count)} ${day.isToday ? styles.today : ''}`}
                    data-tooltip={day.frozen
                      ? `${new Date(day.date + 'T00:00:00').toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' })}\n${t('calendar.freezeUsed')}`
                      : formatTooltip(day.date, day.count, day.correct)}
                    style={{ gridRow: day.dayOfWeek + 1 }}
                    onClick={() => setSelected(
                      selected?.date === day.date ? null : { date: day.date, count: day.count, correct: day.correct },
                    )}
                  >
                    {day.frozen && <span className={styles.frozenIcon}>❄️</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selected && (
        <div className={styles.panel}>
          <span className={styles.panelDate}>
            {new Date(selected.date + 'T00:00:00').toLocaleDateString(dateLocale, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          {selected.count > 0 ? (
            <>
              <span className={styles.panelStat}>{t('calendar.reviewCount', { count: selected.count })}</span>
              <span className={styles.panelStat}>
                {t('calendar.accuracyPct', { pct: Math.round((selected.correct / selected.count) * 100) })}
              </span>
            </>
          ) : (
            <span className={styles.panelStat}>{t('calendar.noReviews')}</span>
          )}
        </div>
      )}
    </div>
  )
}
