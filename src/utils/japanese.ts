import type { KanjiEntry } from '@/core/srs/types'

/** Check if a character is hiragana (U+3040-U+309F) */
export function isHiragana(ch: string): boolean {
  const code = ch.charCodeAt(0)
  return code >= 0x3040 && code <= 0x309f
}

/** Check if a character is katakana (U+30A0-U+30FF) */
export function isKatakana(ch: string): boolean {
  const code = ch.charCodeAt(0)
  return code >= 0x30a0 && code <= 0x30ff
}

/** Check if entire string is hiragana */
export function isAllHiragana(str: string): boolean {
  return str.length > 0 && [...str].every(isHiragana)
}

/** Check if entire string is katakana */
export function isAllKatakana(str: string): boolean {
  return str.length > 0 && [...str].every(isKatakana)
}

/** Convert katakana string to hiragana */
export function katakanaToHiragana(str: string): string {
  return [...str]
    .map(ch => {
      const code = ch.charCodeAt(0)
      if (code >= 0x30a1 && code <= 0x30f6) {
        return String.fromCharCode(code - 0x60)
      }
      return ch
    })
    .join('')
}

/**
 * Normalize a kunYomi reading by stripping the okurigana marker (.) and dash suffixes.
 * e.g. "ひと.つ" → "ひとつ", "あ.う" → "あう"
 */
export function normalizeReading(reading: string): string {
  return reading.replace(/[.-]/g, '')
}

/**
 * Get all valid readings for a kanji, normalized to hiragana for comparison.
 * Returns both the full form and the stem (before the dot) for kunYomi.
 */
function getAllReadings(kanji: KanjiEntry): string[] {
  const readings: string[] = []

  for (const on of kanji.readings.onYomi) {
    readings.push(katakanaToHiragana(on))
  }

  for (const kun of kanji.readings.kunYomi) {
    // Add the full normalized form: "ひと.つ" → "ひとつ"
    readings.push(normalizeReading(kun))
    // Also add the stem before the dot: "ひと.つ" → "ひと"
    const dotIndex = kun.indexOf('.')
    if (dotIndex > 0) {
      readings.push(kun.substring(0, dotIndex))
    }
  }

  return readings
}

/**
 * Check if user input matches any valid reading of the kanji.
 * Accepts both hiragana and katakana input.
 */
export function matchesReading(input: string, kanji: KanjiEntry): boolean {
  const trimmed = input.trim()
  if (trimmed.length === 0) return false

  const normalized = katakanaToHiragana(normalizeReading(trimmed))
  const validReadings = getAllReadings(kanji)

  return validReadings.some(r => r === normalized)
}
