import { useState } from 'react'
import type { AppSettings, QuizMode } from '@/core/srs/types'
import { DEFAULT_SETTINGS } from '@/core/srs/types'
import { loadSettings, saveSettings } from '@/core/storage/settings'
import { updateSchedulerSettings } from '@/core/srs/scheduler'
import styles from './SrsSettings.module.css'

export function SrsSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)
  const [saved, setSaved] = useState(false)

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = () => {
    saveSettings(settings)
    updateSchedulerSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setSettings({ ...DEFAULT_SETTINGS })
    setSaved(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.group}>
        <label className={styles.label}>
          Daily New Cards
          <span className={styles.hint}>Number of new kanji to introduce per day (0–50)</span>
        </label>
        <input
          type="number"
          className={styles.input}
          value={settings.dailyNewCards}
          onChange={e => handleChange('dailyNewCards', Math.max(0, Math.min(50, Number(e.target.value) || 0)))}
          min={0}
          max={50}
        />
      </div>

      <div className={styles.group}>
        <label className={styles.label}>
          Daily Review Limit
          <span className={styles.hint}>Maximum reviews per day (0 = unlimited)</span>
        </label>
        <input
          type="number"
          className={styles.input}
          value={settings.dailyReviewLimit}
          onChange={e => handleChange('dailyReviewLimit', Math.max(0, Number(e.target.value) || 0))}
          min={0}
        />
      </div>

      <div className={styles.group}>
        <label className={styles.label}>
          Target Retention
          <span className={styles.hint}>Desired recall rate (0.70–0.99)</span>
        </label>
        <input
          type="number"
          className={styles.input}
          value={settings.requestRetention}
          onChange={e => handleChange('requestRetention', Math.max(0.7, Math.min(0.99, Number(e.target.value) || 0.9)))}
          min={0.7}
          max={0.99}
          step={0.01}
        />
      </div>

      <div className={styles.group}>
        <label className={styles.label}>
          Maximum Interval (days)
          <span className={styles.hint}>Longest gap between reviews</span>
        </label>
        <input
          type="number"
          className={styles.input}
          value={settings.maximumInterval}
          onChange={e => handleChange('maximumInterval', Math.max(1, Math.min(3650, Number(e.target.value) || 365)))}
          min={1}
          max={3650}
        />
      </div>

      <div className={styles.group}>
        <label className={styles.label}>
          Default Quiz Mode
          <span className={styles.hint}>Default mode when starting a session</span>
        </label>
        <select
          className={styles.select}
          value={settings.defaultQuizMode}
          onChange={e => handleChange('defaultQuizMode', e.target.value as QuizMode)}
        >
          <option value="recognition">Flashcards</option>
          <option value="meaning">Meaning Quiz</option>
          <option value="reading">Reading Quiz</option>
          <option value="writing">Writing Practice</option>
        </select>
      </div>

      <div className={styles.actions}>
        <button className={styles.saveButton} onClick={handleSave} type="button">
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
        <button className={styles.resetButton} onClick={handleReset} type="button">
          Reset to Defaults
        </button>
      </div>
    </div>
  )
}
