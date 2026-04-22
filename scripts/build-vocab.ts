/**
 * Build-time script: parse JMdict_e and emit per-grade vocabulary JSON files.
 *
 * For each Jōyō kanji we keep up to MAX_PER_KANJI vocabulary entries
 * containing that kanji, ranked by JMdict priority codes:
 *
 *   - news1 / ichi1 / spec1 / gai1   → priority "common" (high rank)
 *   - news2 / ichi2 / spec2 / gai2   → priority "common2"
 *   - nfXX                            → frequency rank (lower XX = more common)
 *
 * Output: src/data/vocab-g{N}.json — one file per grade, indexed by literal:
 *   { [literal: string]: VocabExample[] }
 *
 * VocabExample is intentionally compact to keep bundles small:
 *   { w: keb (word in kanji), r: reading, m: english gloss, c: 1 if "common" }
 *
 * Lazy-load by grade, same pattern as kanji-g{N}.json.
 *
 * Usage: npx tsx scripts/build-vocab.ts
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { XMLParser } from 'fast-xml-parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_DIR = join(__dirname, '..', 'src', 'data')
const CACHE_DIR = join(__dirname, '..', '.cache')
const JMDICT_URL = 'http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz'
const JMDICT_GZ = join(CACHE_DIR, 'JMdict_e.gz')
const JMDICT_XML = join(CACHE_DIR, 'JMdict_e')
const GRADES = [1, 2, 3, 4, 5, 6, 8] as const
const MAX_PER_KANJI = 6
const COMMON_TAGS = new Set(['news1', 'ichi1', 'spec1', 'gai1'])
const COMMON_TAGS_2 = new Set(['news2', 'ichi2', 'spec2', 'gai2'])

interface VocabExample {
  w: string  // word (kanji form)
  r: string  // reading (kana)
  m: string  // english gloss (first sense, joined)
  c?: 1     // marked common when present
}

function ensureDir(d: string) {
  if (!existsSync(d)) mkdirSync(d, { recursive: true })
}

function downloadJmdict() {
  if (existsSync(JMDICT_XML)) {
    console.log('Using cached JMdict_e')
    return
  }
  ensureDir(CACHE_DIR)
  console.log('Downloading JMdict_e...')
  execSync(`curl -sL "${JMDICT_URL}" -o "${JMDICT_GZ}"`)
  console.log('Decompressing...')
  execSync(`gunzip -k "${JMDICT_GZ}"`)
}

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined || v === null) return []
  return Array.isArray(v) ? v : [v]
}

interface JmdictKEle {
  keb: string
  ke_pri?: string | string[]
  ke_inf?: string | string[]
}

interface JmdictREle {
  reb: string
  re_pri?: string | string[]
  re_restr?: string | string[]
  re_nokanji?: string
}

interface JmdictSense {
  gloss?: unknown
  pos?: string | string[]
  misc?: string | string[]
}

interface JmdictEntry {
  ent_seq: number
  k_ele?: JmdictKEle | JmdictKEle[]
  r_ele: JmdictREle | JmdictREle[]
  sense: JmdictSense | JmdictSense[]
}

function priorityScore(tags: string[]): { score: number; common: boolean } {
  let score = 0
  let common = false
  for (const t of tags) {
    if (COMMON_TAGS.has(t)) { score += 50; common = true }
    else if (COMMON_TAGS_2.has(t)) { score += 25 }
    else if (t.startsWith('nf')) {
      const rank = parseInt(t.slice(2), 10)
      if (Number.isFinite(rank)) score += Math.max(0, 50 - rank)
    }
  }
  return { score, common }
}

function extractGloss(senses: JmdictSense[]): string {
  for (const s of senses) {
    const glosses = asArray(s.gloss as unknown)
    const first = glosses
      .map(g => (typeof g === 'string' ? g : (g as { '#text'?: string })['#text']))
      .filter((g): g is string => typeof g === 'string' && g.length > 0)
      .slice(0, 2)
    if (first.length > 0) return first.join('; ')
  }
  return ''
}

function loadKanjiLiteralsByGrade(): Map<number, Set<string>> {
  const out = new Map<number, Set<string>>()
  for (const g of GRADES) {
    const file = join(DATA_DIR, `kanji-g${g}.json`)
    if (!existsSync(file)) continue
    const arr = JSON.parse(readFileSync(file, 'utf-8')) as { literal: string }[]
    out.set(g, new Set(arr.map(k => k.literal)))
  }
  return out
}

function literalToGrade(byGrade: Map<number, Set<string>>): Map<string, number> {
  const m = new Map<string, number>()
  for (const [g, set] of byGrade) for (const l of set) m.set(l, g)
  return m
}

function isJoyoChar(ch: string, lookup: Map<string, number>): boolean {
  return lookup.has(ch)
}

interface RankedEntry { entry: VocabExample; score: number; literals: string[] }

async function build() {
  downloadJmdict()
  console.log('Reading JMdict_e XML...')
  const xml = readFileSync(JMDICT_XML, 'utf-8')

  console.log('Parsing XML...')
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    processEntities: false,
    isArray: (name) => ['entry', 'k_ele', 'r_ele', 'sense', 'gloss', 'ke_pri', 're_pri', 'pos', 'misc', 'ke_inf', 'xref'].includes(name),
  })
  const json = parser.parse(xml) as { JMdict: { entry: JmdictEntry[] } }
  const entries = json.JMdict.entry
  console.log(`Parsed ${entries.length} entries`)

  const byGrade = loadKanjiLiteralsByGrade()
  const literalGrade = literalToGrade(byGrade)

  // For each Jōyō literal, accumulate candidate vocabulary entries.
  const candidatesByLiteral = new Map<string, RankedEntry[]>()

  for (const e of entries) {
    const kEles = asArray(e.k_ele)
    if (kEles.length === 0) continue  // kana-only word
    const rEles = asArray(e.r_ele)
    if (rEles.length === 0) continue
    const senses = asArray(e.sense)
    const gloss = extractGloss(senses)
    if (!gloss) continue

    // Pick the primary kanji form (first non-search-only) and primary reading.
    const primaryK = kEles.find(k => {
      const inf = asArray(k.ke_inf)
      return !inf.some(t => t === 'sK' || t === 'iK' || t === 'oK' || t === 'rK')
    }) ?? kEles[0]
    const primaryR = rEles[0]

    const word = primaryK.keb
    const reading = primaryR.reb
    if (!word || !reading) continue

    const allTags = [...asArray(primaryK.ke_pri), ...asArray(primaryR.re_pri)]
    const { score, common } = priorityScore(allTags)

    // Find Jōyō literals present in the word.
    const literals: string[] = []
    for (const ch of word) if (isJoyoChar(ch, literalGrade)) literals.push(ch)
    if (literals.length === 0) continue

    const example: VocabExample = { w: word, r: reading, m: gloss }
    if (common) example.c = 1

    for (const lit of literals) {
      let arr = candidatesByLiteral.get(lit)
      if (!arr) { arr = []; candidatesByLiteral.set(lit, arr) }
      arr.push({ entry: example, score, literals })
    }
  }

  // For each literal, dedupe by word and keep top MAX_PER_KANJI by score.
  // Prefer shorter words slightly to favour standalone vocabulary.
  const finalByLiteral = new Map<string, VocabExample[]>()
  for (const [lit, arr] of candidatesByLiteral) {
    const seen = new Set<string>()
    const ranked = arr
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return a.entry.w.length - b.entry.w.length
      })
      .filter(r => {
        if (seen.has(r.entry.w)) return false
        seen.add(r.entry.w)
        return true
      })
      .slice(0, MAX_PER_KANJI)
      .map(r => r.entry)
    finalByLiteral.set(lit, ranked)
  }

  // Group output by grade.
  let totalKept = 0
  let withAtLeast3 = 0
  for (const [grade, literals] of byGrade) {
    const out: Record<string, VocabExample[]> = {}
    for (const lit of literals) {
      const list = finalByLiteral.get(lit) ?? []
      if (list.length > 0) out[lit] = list
      totalKept += list.length
      if (list.length >= 3) withAtLeast3++
    }
    const path = join(DATA_DIR, `vocab-g${grade}.json`)
    writeFileSync(path, JSON.stringify(out))
    const sizeKb = Math.round((readFileSync(path).length / 1024) * 10) / 10
    console.log(`Wrote ${path} (${Object.keys(out).length} kanji, ${sizeKb} KB)`)
  }

  const total = literalGrade.size
  console.log(`\nDone. ${totalKept} vocab entries kept across ${total} kanji.`)
  console.log(`${withAtLeast3}/${total} kanji have ≥3 examples (${Math.round((withAtLeast3 / total) * 100)}%)`)
}

build().catch(err => { console.error(err); process.exit(1) })
