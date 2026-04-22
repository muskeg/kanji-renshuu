/**
 * Build-time script: derive JLPT N5-N1 levels for each Jōyō kanji.
 *
 * KanjiDic2 only ships the deprecated 4-level JLPT system (old levels 1-4
 * from before 2010). The modern test has 5 levels (N5 easiest → N1 hardest).
 *
 * Heuristic mapping:
 *   - old 4  → N5         (~80 entries, the basic set)
 *   - old 3  → N4         (~250 entries)
 *   - old 2  → grade 1-3 ⇒ N4, grade 4-5 ⇒ N3, grade 6-8 ⇒ N2
 *   - old 1  → grade 1-3 ⇒ N3, grade 4-5 ⇒ N2, grade 6-8 ⇒ N1
 *   - none   → grade 1-2 ⇒ N5, grade 3-4 ⇒ N4, grade 5-6 ⇒ N3, grade 8 ⇒ N1
 *
 * `scripts/data/jlpt-overrides.json` lets us correct individual entries
 * without re-running the heuristic.
 *
 * Output: writes `jlptN: 1|2|3|4|5|null` directly back into each
 * `src/data/kanji-g{N}.json` file (preserves the rest of the entry).
 *
 * Usage: npx tsx scripts/build-jlpt.ts
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_DIR = join(__dirname, '..', 'src', 'data')
const OVERRIDES_PATH = join(__dirname, 'data', 'jlpt-overrides.json')
const GRADES = [1, 2, 3, 4, 5, 6, 8] as const

type JlptN = 1 | 2 | 3 | 4 | 5 | null

interface Entry {
  literal: string
  grade: number
  jlpt: number | null
  jlptN?: JlptN
  [k: string]: unknown
}

function deriveJlptN(jlpt: number | null, grade: number): JlptN {
  if (jlpt === 4) return 5
  if (jlpt === 3) return 4
  if (jlpt === 2) {
    if (grade <= 3) return 4
    if (grade <= 5) return 3
    return 2
  }
  if (jlpt === 1) {
    if (grade <= 3) return 3
    if (grade <= 5) return 2
    return 1
  }
  // No old-JLPT info — fall back on grade alone.
  if (grade <= 2) return 5
  if (grade <= 4) return 4
  if (grade <= 6) return 3
  return 1
}

const overrides = (() => {
  if (!existsSync(OVERRIDES_PATH)) return {} as Record<string, JlptN>
  try {
    const raw = JSON.parse(readFileSync(OVERRIDES_PATH, 'utf-8')) as { overrides?: Record<string, JlptN> }
    return raw.overrides ?? {}
  } catch {
    return {} as Record<string, JlptN>
  }
})()

let totalCount = 0
let overrideHits = 0

for (const g of GRADES) {
  const file = join(DATA_DIR, `kanji-g${g}.json`)
  if (!existsSync(file)) continue
  const arr = JSON.parse(readFileSync(file, 'utf-8')) as Entry[]
  for (const entry of arr) {
    const override = overrides[entry.literal]
    if (override !== undefined) {
      entry.jlptN = override
      overrideHits++
    } else {
      entry.jlptN = deriveJlptN(entry.jlpt, entry.grade)
    }
    totalCount++
  }
  writeFileSync(file, JSON.stringify(arr))
  console.log(`Updated ${file} (${arr.length} entries)`)
}

console.log(`Done — ${totalCount} kanji tagged with jlptN (${overrideHits} via overrides)`)
