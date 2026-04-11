import { useState, useEffect, useCallback } from 'react'
import type { AppSettings } from '@/core/srs/types'
import { loadSettings, saveSettings } from '@/core/storage/settings'

type ThemePref = AppSettings['theme']

function getEffectiveTheme(pref: ThemePref): 'dark' | 'light' {
  if (pref === 'dark' || pref === 'light') return pref
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme(theme: 'dark' | 'light') {
  document.documentElement.setAttribute('data-theme', theme)
}

const THEME_EVENT = 'kanji-renshuu-theme-change'

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(() => loadSettings().theme)

  useEffect(() => {
    applyTheme(getEffectiveTheme(pref))

    if (pref !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const handler = () => applyTheme(getEffectiveTheme('system'))
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [pref])

  // Sync across multiple hook instances
  useEffect(() => {
    const handler = () => setPref(loadSettings().theme)
    window.addEventListener(THEME_EVENT, handler)
    return () => window.removeEventListener(THEME_EVENT, handler)
  }, [])

  const setTheme = useCallback((next: ThemePref) => {
    const settings = loadSettings()
    settings.theme = next
    saveSettings(settings)
    setPref(next)
    applyTheme(getEffectiveTheme(next))
    window.dispatchEvent(new Event(THEME_EVENT))
  }, [])

  const cycleTheme = useCallback(() => {
    const order: ThemePref[] = ['system', 'light', 'dark']
    const settings = loadSettings()
    const idx = order.indexOf(settings.theme)
    const next = order[(idx + 1) % order.length]!
    setTheme(next)
  }, [setTheme])

  return { theme: pref, effectiveTheme: getEffectiveTheme(pref), setTheme, cycleTheme }
}
