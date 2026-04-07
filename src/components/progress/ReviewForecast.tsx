import { useState, useEffect } from 'react'
import { getAllCardStates } from '@/core/storage/db'
import { computeForecast } from '@/core/srs/forecast'
import type { ForecastDay } from '@/core/srs/forecast'
import styles from './ReviewForecast.module.css'

export function ReviewForecast() {
  const [forecast, setForecast] = useState<ForecastDay[]>([])

  useEffect(() => {
    getAllCardStates().then(cards => {
      setForecast(computeForecast(cards))
    })
  }, [])

  const maxCount = Math.max(1, ...forecast.map(d => d.dueCount))
  const hasAny = forecast.some(d => d.dueCount > 0)

  if (!hasAny) return null

  return (
    <div className={styles.container}>
      {forecast.map(day => (
        <div key={day.date} className={styles.row}>
          <span className={styles.label}>{day.label}</span>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{ width: `${Math.max(day.dueCount > 0 ? 4 : 0, (day.dueCount / maxCount) * 100)}%` }}
            />
          </div>
          <span className={styles.count}>{day.dueCount}</span>
        </div>
      ))}
    </div>
  )
}
