/**
 * Build-time script: cluster visually similar Jōyō kanji.
 *
 * Heuristic: two kanji are "look-alikes" when they share at least one
 * component AND |strokeCount delta| ≤ 1. We rank candidates by:
 *   1. Number of shared components (more = more visually similar)
 *   2. Stroke-count proximity
 *   3. Same primary radical bonus
 *
 * Output: src/data/lookalikes.json
 *   { [literal: string]: string[]  // up to MAX_PER_KANJI literals }
 *
 * Pure function over already-built per-grade JSON — no network.
 *
 * Usage: npx tsx scripts/build-lookalikes.ts
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_DIR = join(__dirname, '..', 'src', 'data')
const OUT_PATH = join(DATA_DIR, 'lookalikes.json')
const GRADES = [1, 2, 3, 4, 5, 6, 8] as const
const MAX_PER_KANJI = 5

interface Entry {
  literal: string
  strokeCount: number
  components: string[]
  radical?: number
}

function loadAll(): Entry[] {
  const all: Entry[] = []
  for (const g of GRADES) {
    const file = join(DATA_DIR, `kanji-g${g}.json`)
    if (!existsSync(file)) continue
    const arr = JSON.parse(readFileSync(file, 'utf-8')) as Entry[]
    all.push(...arr)
  }
  return all
}

function score(a: Entry, b: Entry): number {
  if (a.literal === b.literal) return -Infinity
  const strokeDelta = Math.abs(a.strokeCount - b.strokeCount)
  if (strokeDelta > 1) return -Infinity

  const aComp = new Set(a.components)
  let shared = 0
  for (const c of b.components) if (aComp.has(c)) shared++

  const sameRadical = a.radical && b.radical && a.radical === b.radical

  // Cluster requires either a shared component OR the same Kangxi radical.
  // (KanjiVG component data is sparse for many Jōyō entries; the radical
  // fallback keeps coverage broad.)
  if (shared === 0 && !sameRadical) return -Infinity

  let s = shared * 10 - strokeDelta * 3
  if (sameRadical) s += 4
  return s
}

function build(): Record<string, string[]> {
  const all = loadAll()
  const out: Record<string, string[]> = {}
  for (const a of all) {
    const ranked = all
      .map(b => ({ literal: b.literal, score: score(a, b) }))
      .filter(x => x.score > -Infinity)
      .sort((x, y) => y.score - x.score)
      .slice(0, MAX_PER_KANJI)
      .map(x => x.literal)
    if (ranked.length > 0) out[a.literal] = ranked
  }
  return out
}

const result = build()
writeFileSync(OUT_PATH, JSON.stringify(result))
const count = Object.keys(result).length
console.log(`Wrote ${OUT_PATH} — ${count} kanji with look-alikes`)
