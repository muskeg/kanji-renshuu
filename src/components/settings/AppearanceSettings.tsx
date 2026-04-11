import { useState } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { loadSettings, saveSettings } from '@/core/storage/settings'
import styles from './AppearanceSettings.module.css'

const THEME_OPTIONS = [
  { value: 'system', label: 'System', icon: '💻' },
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
] as const

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  const [soundEnabled, setSoundEnabled] = useState(() => loadSettings().soundEnabled)

  const toggleSound = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    const settings = loadSettings()
    settings.soundEnabled = next
    saveSettings(settings)
  }

  return (
    <div className={styles.container}>
      <div className={styles.group}>
        <span className={styles.label}>Theme</span>
        <span className={styles.hint}>Choose your preferred color scheme</span>
        <div className={styles.options}>
          {THEME_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`${styles.option} ${theme === opt.value ? styles.optionActive : ''}`}
              onClick={() => setTheme(opt.value)}
              type="button"
              aria-pressed={theme === opt.value}
            >
              <span className={styles.optionIcon}>{opt.icon}</span>
              <span className={styles.optionLabel}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.label}>Sound Effects</span>
        <span className={styles.hint}>Play audio feedback during reviews</span>
        <button
          className={`${styles.toggle} ${soundEnabled ? styles.toggleOn : ''}`}
          onClick={toggleSound}
          type="button"
          role="switch"
          aria-checked={soundEnabled}
        >
          <span className={styles.toggleThumb} />
          <span className={styles.toggleLabel}>{soundEnabled ? 'On' : 'Off'}</span>
        </button>
      </div>
    </div>
  )
}
