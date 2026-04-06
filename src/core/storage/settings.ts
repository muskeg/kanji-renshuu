import type { AppSettings } from '@/core/srs/types'
import { DEFAULT_SETTINGS } from '@/core/srs/types'

const SETTINGS_KEY = 'kanji-renshuu-settings'

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...(parsed as Partial<AppSettings>) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function resetSettings(): void {
  localStorage.removeItem(SETTINGS_KEY)
}
