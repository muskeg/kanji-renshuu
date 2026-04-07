/**
 * Parse KanjiVG combined XML file and extract stroke order SVG data per kanji.
 *
 * Downloads kanjivg-YYYYMMDD.xml.gz from GitHub releases if not cached,
 * then parses the XML to extract <path d="..."> elements in stroke order.
 *
 * Each kanji gets a minimal SVG string containing only <path> elements
 * inside the standard 109x109 viewBox, suitable for inline rendering.
 */

import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join } from 'node:path'
import { XMLParser } from 'fast-xml-parser'

const KANJIVG_RELEASE = '20250816'
const KANJIVG_URL = `https://github.com/KanjiVG/kanjivg/releases/download/r${KANJIVG_RELEASE}/kanjivg-${KANJIVG_RELEASE}.xml.gz`

interface KanjiVGData {
  /** Map from kanji character → SVG string with stroke paths */
  strokeSvgMap: Map<string, string>
}

/**
 * Recursively extract all <path> elements with their id and d attribute.
 * Returns unsorted — caller must sort by stroke number from id.
 */
function extractPaths(node: unknown): { id: string; d: string }[] {
  if (node === null || node === undefined || typeof node !== 'object') return []

  const results: { id: string; d: string }[] = []
  const obj = node as Record<string, unknown>

  // If this node is a <path> with a d attribute
  if (obj['@_d'] && typeof obj['@_d'] === 'string' && obj['@_id']) {
    results.push({ id: obj['@_id'] as string, d: obj['@_d'] as string })
  }

  // Recurse into <path> children (could be single or array)
  const pathChildren = obj['path']
  if (pathChildren) {
    const pathArr = Array.isArray(pathChildren) ? pathChildren : [pathChildren]
    for (const p of pathArr) {
      if (p && typeof p === 'object') {
        const po = p as Record<string, unknown>
        if (po['@_d'] && po['@_id']) {
          results.push({ id: po['@_id'] as string, d: po['@_d'] as string })
        }
      }
    }
  }

  // Recurse into <g> children (could be single or array)
  const gChildren = obj['g']
  if (gChildren) {
    const gArr = Array.isArray(gChildren) ? gChildren : [gChildren]
    for (const g of gArr) {
      results.push(...extractPaths(g))
    }
  }

  return results
}

/** Extract the stroke number from a KanjiVG path id like "kvg:0672c-s3" → 3 */
function strokeNumber(id: string): number {
  const m = /-s(\d+)$/.exec(id)
  return m ? parseInt(m[1], 10) : 0
}

/**
 * Build a minimal SVG string from an array of path d-attribute values.
 * Uses the KanjiVG standard 109x109 viewBox.
 */
function buildSvgString(paths: string[]): string {
  const pathElements = paths
    .map((d) => `<path d="${d}"/>`)
    .join('')
  return `<svg viewBox="0 0 109 109" xmlns="http://www.w3.org/2000/svg">${pathElements}</svg>`
}

/**
 * Download and parse KanjiVG data. Returns a map from kanji character to SVG string.
 */
export function parseKanjiVG(cacheDir: string): KanjiVGData {
  const gzPath = join(cacheDir, `kanjivg-${KANJIVG_RELEASE}.xml.gz`)
  const xmlPath = join(cacheDir, `kanjivg-${KANJIVG_RELEASE}.xml`)

  // Download if not cached
  if (!existsSync(xmlPath)) {
    if (!existsSync(gzPath)) {
      console.log(`Downloading KanjiVG ${KANJIVG_RELEASE}...`)
      execSync(`curl -sL "${KANJIVG_URL}" -o "${gzPath}"`)
    }
    console.log('Decompressing KanjiVG...')
    execSync(`gunzip -kf "${gzPath}"`)
  } else {
    console.log('Using cached KanjiVG XML')
  }

  const xml = readFileSync(xmlPath, 'utf-8')

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => ['kanji', 'g', 'path'].includes(name),
  })

  const parsed = parser.parse(xml)
  const kanjiElements = parsed.kanjivg?.kanji as unknown[] | undefined

  if (!kanjiElements) {
    throw new Error('Failed to parse KanjiVG XML: no <kanji> elements found')
  }

  const strokeSvgMap = new Map<string, string>()

  for (const kanjiEl of kanjiElements) {
    const el = kanjiEl as Record<string, unknown>
    const id = el['@_id'] as string | undefined
    if (!id) continue

    // Extract hex code from id like "kvg:kanji_06f22"
    const match = /kvg:kanji_([0-9a-f]+)/.exec(id)
    if (!match) continue

    const codePoint = parseInt(match[1], 16)
    // Skip non-CJK characters (ASCII, punctuation, etc.)
    if (codePoint < 0x3000) continue

    const char = String.fromCodePoint(codePoint)

    // Extract all path d-attributes and sort by stroke number from id
    const gElements = el['g']
    if (!gElements) continue

    const gArr = Array.isArray(gElements) ? gElements : [gElements]
    const rawPaths: { id: string; d: string }[] = []
    for (const g of gArr) {
      rawPaths.push(...extractPaths(g))
    }

    // Sort by stroke number suffix (e.g., kvg:0672c-s1 → 1, kvg:0672c-s2 → 2)
    rawPaths.sort((a, b) => strokeNumber(a.id) - strokeNumber(b.id))
    const paths = rawPaths.map(p => p.d)

    if (paths.length > 0) {
      strokeSvgMap.set(char, buildSvgString(paths))
    }
  }

  return { strokeSvgMap }
}
