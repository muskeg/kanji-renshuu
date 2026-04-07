/**
 * Build-time script to download and parse KanjiDic2 XML into per-grade JSON files.
 *
 * Usage: npx tsx scripts/build-data.ts
 *
 * Downloads KanjiDic2 XML from EDRDG, parses it, filters to Jōyō kanji only,
 * and outputs grade-split JSON files to src/data/.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { XMLParser } from 'fast-xml-parser'
import { parseKanjiVG } from './parse-kanjivg.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface KanjiEntry {
  literal: string
  grade: number
  jlpt: number | null
  strokeCount: number
  frequency: number | null
  radical: number
  readings: {
    onYomi: string[]
    kunYomi: string[]
    nanori: string[]
  }
  meanings: string[]
  strokeOrderSvg: string
  components: string[]
}

const DATA_DIR = join(__dirname, '..', 'src', 'data')
const CACHE_DIR = join(__dirname, '..', '.cache')
const KANJIDIC2_URL = 'http://www.edrdg.org/kanjidic/kanjidic2.xml.gz'
const KANJIDIC2_GZ = join(CACHE_DIR, 'kanjidic2.xml.gz')
const KANJIDIC2_XML = join(CACHE_DIR, 'kanjidic2.xml')

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function downloadKanjidic2() {
  if (existsSync(KANJIDIC2_XML)) {
    console.log('Using cached kanjidic2.xml')
    return
  }

  ensureDir(CACHE_DIR)
  console.log('Downloading KanjiDic2...')
  execSync(`curl -sL "${KANJIDIC2_URL}" -o "${KANJIDIC2_GZ}"`)
  console.log('Decompressing...')
  execSync(`gunzip -f "${KANJIDIC2_GZ}"`)
  console.log('Download complete.')
}

function asArray<T>(val: T | T[] | undefined): T[] {
  if (val === undefined || val === null) return []
  return Array.isArray(val) ? val : [val]
}

function parseKanjidic2(): KanjiEntry[] {
  const xml = readFileSync(KANJIDIC2_XML, 'utf-8')

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => {
      return [
        'character', 'reading', 'meaning', 'nanori',
        'rad_value', 'stroke_count', 'cp_value', 'dic_ref',
        'q_code', 'variant', 'rmgroup',
      ].includes(name)
    },
  })

  const parsed = parser.parse(xml)
  const characters = parsed.kanjidic2.character as unknown[]

  // Jōyō grades: 1-6 (elementary), 8 (secondary)
  const joyoGrades = new Set([1, 2, 3, 4, 5, 6, 8])
  const entries: KanjiEntry[] = []

  for (const char of characters) {
    const c = char as Record<string, unknown>
    const misc = c.misc as Record<string, unknown> | undefined
    if (!misc) continue

    const grade = misc.grade as number | undefined
    if (!grade || !joyoGrades.has(grade)) continue

    const literal = c.literal as string

    // Stroke count
    const strokeCounts = asArray(misc.stroke_count as number | number[])
    const strokeCount = strokeCounts[0] ?? 0

    // Frequency
    const frequency = (misc.freq as number) ?? null

    // JLPT (old 4-level)
    const jlpt = (misc.jlpt as number) ?? null

    // Radical
    const radicals = c.radical as Record<string, unknown> | undefined
    let radical = 0
    if (radicals) {
      const radValues = asArray(radicals.rad_value as Record<string, unknown> | Record<string, unknown>[])
      for (const rv of radValues) {
        if (rv['@_rad_type'] === 'classical') {
          radical = Number(rv['#text'] ?? rv)
          break
        }
      }
    }

    // Readings and meanings
    const onYomi: string[] = []
    const kunYomi: string[] = []
    const meanings: string[] = []

    const readingMeaning = c.reading_meaning as Record<string, unknown> | undefined
    if (readingMeaning) {
      const rmgroups = asArray(readingMeaning.rmgroup as Record<string, unknown> | Record<string, unknown>[])

      for (const rmg of rmgroups) {
        const readings = asArray(rmg.reading as Record<string, unknown> | Record<string, unknown>[])
        for (const r of readings) {
          const rType = r['@_r_type'] as string
          const rText = (r['#text'] ?? r) as string
          if (typeof rText !== 'string') continue
          if (rType === 'ja_on') onYomi.push(rText)
          else if (rType === 'ja_kun') kunYomi.push(rText)
        }

        const meaningsRaw = asArray(rmg.meaning as (string | Record<string, unknown>) | (string | Record<string, unknown>)[])
        for (const m of meaningsRaw) {
          if (typeof m === 'string') {
            meanings.push(m)
          } else if (typeof m === 'object' && m !== null) {
            // Meanings with m_lang attribute — only include English (no attribute)
            if (!m['@_m_lang']) {
              meanings.push(String(m['#text'] ?? ''))
            }
          }
        }
      }

      // Nanori
      const nanoriRaw = asArray(readingMeaning.nanori as string | string[])
      const nanori = nanoriRaw.filter((n): n is string => typeof n === 'string')

      entries.push({
        literal,
        grade,
        jlpt,
        strokeCount,
        frequency,
        radical,
        readings: { onYomi, kunYomi, nanori },
        meanings,
        strokeOrderSvg: '',
        components: [],
      })
    }
  }

  return entries
}

function writeGradeFiles(entries: KanjiEntry[]) {
  ensureDir(DATA_DIR)

  const byGrade = new Map<number, KanjiEntry[]>()
  for (const entry of entries) {
    const existing = byGrade.get(entry.grade) ?? []
    existing.push(entry)
    byGrade.set(entry.grade, existing)
  }

  for (const [grade, kanji] of byGrade) {
    // Sort by frequency within grade
    kanji.sort((a, b) => (a.frequency ?? 9999) - (b.frequency ?? 9999))
    const path = join(DATA_DIR, `kanji-g${grade}.json`)
    writeFileSync(path, JSON.stringify(kanji, null, 0))
    console.log(`  Grade ${grade}: ${kanji.length} kanji → ${path}`)
  }

  console.log(`\nTotal Jōyō kanji: ${entries.length}`)
}

function validate(entries: KanjiEntry[]) {
  let errors = 0

  for (const entry of entries) {
    if (entry.readings.onYomi.length === 0 && entry.readings.kunYomi.length === 0) {
      console.warn(`  ⚠ ${entry.literal}: no ON or KUN readings`)
      errors++
    }
    if (entry.meanings.length === 0) {
      console.warn(`  ⚠ ${entry.literal}: no meanings`)
      errors++
    }
  }

  if (entries.length < 2100) {
    console.warn(`  ⚠ Expected ~2136 Jōyō kanji, got ${entries.length}`)
    errors++
  }

  if (errors === 0) {
    console.log('✓ All kanji validated successfully')
  } else {
    console.warn(`⚠ ${errors} validation warning(s)`)
  }
}

// Main
console.log('=== Kanji Renshū Data Pipeline ===\n')

downloadKanjidic2()

console.log('\nParsing KanjiDic2...')
const entries = parseKanjidic2()

console.log('\nParsing KanjiVG stroke data...')
const { strokeSvgMap } = parseKanjiVG(CACHE_DIR)
console.log(`  Found stroke data for ${strokeSvgMap.size} characters`)

// Merge stroke order SVG data into kanji entries
let strokeHits = 0
for (const entry of entries) {
  const svg = strokeSvgMap.get(entry.literal)
  if (svg) {
    entry.strokeOrderSvg = svg
    strokeHits++
  }
}
console.log(`  Matched ${strokeHits}/${entries.length} Jōyō kanji (${((strokeHits / entries.length) * 100).toFixed(1)}%)`)

console.log('\nWriting grade files...')
writeGradeFiles(entries)

console.log('\nValidating...')
validate(entries)

console.log('\n✓ Data pipeline complete')
