import { useState } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { loadSettings, saveSettings } from '@/core/storage/settings'
import { useTranslation } from '@/i18n'
import type { Locale } from '@/i18n/types'
import styles from './AppearanceSettings.module.css'

const SCALE_OPTIONS = [75, 80, 90, 100, 110, 125, 150] as const

export function AppearanceSettings() {
  const { t, locale, setLocale } = useTranslation()
  const { theme, setTheme } = useTheme()
  const { canInstall, promptInstall } = useInstallPrompt()
  const [soundEnabled, setSoundEnabled] = useState(() => loadSettings().soundEnabled)
  const [uiScale, setUiScale] = useState(() => loadSettings().uiScale)

  const THEME_OPTIONS = [
    { value: 'system', label: t('appearance.system'), icon: '💻' },
    { value: 'light', label: t('appearance.light'), icon: '☀️' },
    { value: 'dark', label: t('appearance.dark'), icon: '🌙' },
  ] as const

  const LANGUAGE_OPTIONS: { value: Locale; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
  ]

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
        <span className={styles.label}>{t('appearance.language')}</span>
        <span className={styles.hint}>{t('appearance.languageHint')}</span>
        <div className={styles.options}>
          {LANGUAGE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`${styles.option} ${locale === opt.value ? styles.optionActive : ''}`}
              onClick={() => {
                setLocale(opt.value)
                const settings = loadSettings()
                settings.language = opt.value
                saveSettings(settings)
              }}
              type="button"
              aria-pressed={locale === opt.value}
            >
              <span className={styles.optionLabel}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.label}>{t('appearance.theme')}</span>
        <span className={styles.hint}>{t('appearance.themeHint')}</span>
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
        <span className={styles.label}>{t('appearance.sound')}</span>
        <span className={styles.hint}>{t('appearance.soundHint')}</span>
        <button
          className={`${styles.toggle} ${soundEnabled ? styles.toggleOn : ''}`}
          onClick={toggleSound}
          type="button"
          role="switch"
          aria-checked={soundEnabled}
        >
          <span className={styles.toggleThumb} />
          <span className={styles.toggleLabel}>{soundEnabled ? t('appearance.on') : t('appearance.off')}</span>
        </button>
      </div>

      <div className={styles.group}>
        <span className={styles.label}>{t('appearance.uiScale')}</span>
        <span className={styles.hint}>{t('appearance.uiScaleHint')}</span>
        <div className={styles.scaleControl}>
          <select
            className={styles.scaleSelect}
            value={uiScale}
            onChange={e => {
              const value = Number(e.target.value)
              setUiScale(value)
              const settings = loadSettings()
              settings.uiScale = value
              saveSettings(settings)
              document.documentElement.style.zoom = `${value}%`
            }}
          >
            {SCALE_OPTIONS.map(v => (
              <option key={v} value={v}>{v}%</option>
            ))}
          </select>
        </div>
      </div>

      {canInstall && (
        <div className={styles.group}>
          <span className={styles.label}>{t('pwa.install')}</span>
          <span className={styles.hint}>{t('pwa.installDesc')}</span>
          <button
            className={styles.installBtn}
            onClick={promptInstall}
            type="button"
          >
            📲 {t('pwa.install')}
          </button>
        </div>
      )}
    </div>
  )
}
