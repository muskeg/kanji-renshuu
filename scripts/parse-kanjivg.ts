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
 * Recursively extract all <path d="..."> values from nested <g>/<path> elements.
 * Preserves document order (which is stroke order in KanjiVG).
 */
function extractPaths(node: unknown): string[] {
  if (node === null || node === undefined || typeof node !== 'object') return []

  const paths: string[] = []
  const obj = node as Record<string, unknown>

  // If this node is a <path> with a d attribute
  if (obj['@_d'] && typeof obj['@_d'] === 'string') {
    paths.push(obj['@_d'])
  }

  // Recurse into <path> children (could be single or array)
  const pathChildren = obj['path']
  if (pathChildren) {
    const pathArr = Array.isArray(pathChildren) ? pathChildren : [pathChildren]
    for (const p of pathArr) {
      if (p && typeof p === 'object' && (p as Record<string, unknown>)['@_d']) {
        paths.push((p as Record<string, unknown>)['@_d'] as string)
      }
    }
  }

  // Recurse into <g> children (could be single or array)
  const gChildren = obj['g']
  if (gChildren) {
    const gArr = Array.isArray(gChildren) ? gChildren : [gChildren]
    for (const g of gArr) {
      paths.push(...extractPaths(g))
    }
  }

  return paths
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

    // Extract all path d-attributes in stroke order
    const gElements = el['g']
    if (!gElements) continue

    const gArr = Array.isArray(gElements) ? gElements : [gElements]
    const paths: string[] = []
    for (const g of gArr) {
      paths.push(...extractPaths(g))
    }

    if (paths.length > 0) {
      strokeSvgMap.set(char, buildSvgString(paths))
    }
  }

  return { strokeSvgMap }
}
