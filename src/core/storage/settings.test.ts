import { describe, it, expect, beforeEach } from 'vitest'
import { loadSettings, saveSettings, resetSettings } from '@/core/storage/settings'
import { DEFAULT_SETTINGS } from '@/core/srs/types'

describe('settings', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('loadSettings', () => {
    it('returns defaults when no settings stored', () => {
      const settings = loadSettings()
      expect(settings).toEqual(DEFAULT_SETTINGS)
    })

    it('returns stored settings when available', () => {
      const custom = { ...DEFAULT_SETTINGS, dailyNewCards: 20 }
      localStorage.setItem('kanji-renshuu-settings', JSON.stringify(custom))
      const settings = loadSettings()
      expect(settings.dailyNewCards).toBe(20)
    })

    it('merges partial settings with defaults', () => {
      localStorage.setItem('kanji-renshuu-settings', JSON.stringify({ dailyNewCards: 5 }))
      const settings = loadSettings()
      expect(settings.dailyNewCards).toBe(5)
      expect(settings.requestRetention).toBe(DEFAULT_SETTINGS.requestRetention)
    })

    it('handles corrupted JSON gracefully', () => {
      localStorage.setItem('kanji-renshuu-settings', 'not json')
      const settings = loadSettings()
      expect(settings).toEqual(DEFAULT_SETTINGS)
    })
  })

  describe('saveSettings', () => {
    it('persists settings to localStorage', () => {
      const custom = { ...DEFAULT_SETTINGS, dailyNewCards: 25 }
      saveSettings(custom)
      const raw = localStorage.getItem('kanji-renshuu-settings')
      expect(raw).toBeTruthy()
      const parsed = JSON.parse(raw!)
      expect(parsed.dailyNewCards).toBe(25)
    })
  })

  describe('resetSettings', () => {
    it('removes settings from localStorage', () => {
      saveSettings(DEFAULT_SETTINGS)
      expect(localStorage.getItem('kanji-renshuu-settings')).toBeTruthy()
      resetSettings()
      expect(localStorage.getItem('kanji-renshuu-settings')).toBeNull()
    })
  })
})
