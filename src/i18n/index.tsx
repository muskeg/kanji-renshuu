/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useSyncExternalStore, useCallback, type ReactNode } from 'react'
import type { Locale } from './types'
import type { KanjiEntry } from '@/core/srs/types'
import en from './en'
import fr from './fr'

type TranslationKey = keyof typeof en

const translations = { en, fr } as const

// --- Module-level state (shared between React and non-React code) ---

let currentLocale: Locale = 'en'
const listeners = new Set<() => void>()

function notifyListeners() {
  for (const fn of listeners) fn()
}

export function getLocale(): Locale {
  return currentLocale
}

export function setLocale(locale: Locale): void {
  if (locale === currentLocale) return
  currentLocale = locale
  notifyListeners()
}

/** Translate a key with optional interpolation params */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const dict = translations[currentLocale] ?? en
  let str: string = dict[key] ?? en[key] ?? key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replaceAll(`{{${k}}}`, String(v))
    }
  }
  return str
}

/** Return locale-appropriate meanings for a kanji entry */
export function getMeanings(kanji: KanjiEntry): string[] {
  if (currentLocale === 'fr' && kanji.meaningsFr && kanji.meaningsFr.length > 0) {
    return kanji.meaningsFr
  }
  return kanji.meanings
}

// --- React context ---

interface I18nContextValue {
  t: typeof t
  locale: Locale
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

function subscribe(callback: () => void): () => void {
  listeners.add(callback)
  return () => { listeners.delete(callback) }
}

function getSnapshot(): Locale {
  return currentLocale
}

export function I18nProvider({ locale: initialLocale, children }: { locale: Locale; children: ReactNode }) {
  // Sync initial locale
  useState(() => { setLocale(initialLocale) })

  // Re-render on locale changes
  const locale = useSyncExternalStore(subscribe, getSnapshot)

  const ctxSetLocale = useCallback((l: Locale) => { setLocale(l) }, [])

  // Update when prop changes
  useEffect(() => { setLocale(initialLocale) }, [initialLocale])

  return (
    <I18nContext.Provider value={{ t, locale, setLocale: ctxSetLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(I18nContext)
  const locale = useSyncExternalStore(subscribe, getSnapshot)
  if (!ctx) {
    // Fallback for use outside provider (e.g., tests)
    return { t, locale, setLocale }
  }
  return ctx
}
