import { describe, it, expect } from 'vitest'
import {
  isHiragana,
  isKatakana,
  isAllHiragana,
  isAllKatakana,
  katakanaToHiragana,
  normalizeReading,
  matchesReading,
} from '@/utils/japanese'
import type { KanjiEntry } from '@/core/srs/types'

function makeKanji(overrides: Partial<KanjiEntry> = {}): KanjiEntry {
  return {
    literal: '日',
    grade: 1,
    jlpt: 4,
    strokeCount: 4,
    frequency: 1,
    radical: 72,
    readings: {
      onYomi: ['ニチ', 'ジツ'],
      kunYomi: ['ひ', 'か'],
      nanori: [],
    },
    meanings: ['day', 'sun', 'Japan'],
    meaningsFr: ['jour', 'soleil', 'Japon'],
    strokeOrderSvg: '',
    components: [],
    ...overrides,
  }
}

describe('isHiragana', () => {
  it('returns true for hiragana characters', () => {
    expect(isHiragana('あ')).toBe(true)
    expect(isHiragana('ん')).toBe(true)
  })
  it('returns false for katakana', () => {
    expect(isHiragana('ア')).toBe(false)
  })
  it('returns false for latin', () => {
    expect(isHiragana('a')).toBe(false)
  })
})

describe('isKatakana', () => {
  it('returns true for katakana characters', () => {
    expect(isKatakana('ア')).toBe(true)
    expect(isKatakana('ン')).toBe(true)
  })
  it('returns false for hiragana', () => {
    expect(isKatakana('あ')).toBe(false)
  })
})

describe('isAllHiragana', () => {
  it('returns true for all-hiragana strings', () => {
    expect(isAllHiragana('ひらがな')).toBe(true)
  })
  it('returns false for mixed strings', () => {
    expect(isAllHiragana('ひらカナ')).toBe(false)
  })
  it('returns false for empty strings', () => {
    expect(isAllHiragana('')).toBe(false)
  })
})

describe('isAllKatakana', () => {
  it('returns true for all-katakana strings', () => {
    expect(isAllKatakana('カタカナ')).toBe(true)
  })
  it('returns false for mixed strings', () => {
    expect(isAllKatakana('カタかな')).toBe(false)
  })
})

describe('katakanaToHiragana', () => {
  it('converts katakana to hiragana', () => {
    expect(katakanaToHiragana('ニチ')).toBe('にち')
    expect(katakanaToHiragana('ジツ')).toBe('じつ')
  })
  it('leaves hiragana unchanged', () => {
    expect(katakanaToHiragana('ひ')).toBe('ひ')
  })
})

describe('normalizeReading', () => {
  it('strips dots from okurigana', () => {
    expect(normalizeReading('ひと.つ')).toBe('ひとつ')
    expect(normalizeReading('あ.う')).toBe('あう')
  })
  it('strips dashes', () => {
    expect(normalizeReading('ひ-')).toBe('ひ')
  })
  it('leaves clean readings unchanged', () => {
    expect(normalizeReading('ひ')).toBe('ひ')
  })
})

describe('matchesReading', () => {
  const kanji = makeKanji()

  it('matches ON yomi in katakana', () => {
    expect(matchesReading('ニチ', kanji)).toBe(true)
    expect(matchesReading('ジツ', kanji)).toBe(true)
  })

  it('matches ON yomi in hiragana', () => {
    expect(matchesReading('にち', kanji)).toBe(true)
  })

  it('matches KUN yomi', () => {
    expect(matchesReading('ひ', kanji)).toBe(true)
    expect(matchesReading('か', kanji)).toBe(true)
  })

  it('matches normalized KUN yomi with okurigana', () => {
    const k = makeKanji({
      readings: {
        onYomi: [],
        kunYomi: ['あ.う'],
        nanori: [],
      },
    })
    expect(matchesReading('あう', k)).toBe(true)
    expect(matchesReading('あ', k)).toBe(true) // stem match
  })

  it('rejects invalid readings', () => {
    expect(matchesReading('ゆ', kanji)).toBe(false)
    expect(matchesReading('', kanji)).toBe(false)
    expect(matchesReading('abc', kanji)).toBe(false)
  })

  it('trims whitespace from input', () => {
    expect(matchesReading('  にち  ', kanji)).toBe(true)
  })
})
