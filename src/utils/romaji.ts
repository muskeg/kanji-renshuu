/**
 * Romaji-to-kana live conversion utility.
 * Converts roman letter input into hiragana as the user types,
 * similar to a lightweight Japanese IME.
 */

/** Romaji → hiragana mapping table (longest match first) */
const ROMAJI_MAP: ReadonlyMap<string, string> = new Map([
  // Four-char combos
  ['xtsu', 'っ'],
  ['ltsu', 'っ'],

  // Three-char combos — yōon + digraphs
  ['sha', 'しゃ'], ['shi', 'し'], ['shu', 'しゅ'], ['sho', 'しょ'],
  ['chi', 'ち'], ['tsu', 'つ'], ['cha', 'ちゃ'], ['chu', 'ちゅ'], ['cho', 'ちょ'],
  ['tya', 'ちゃ'], ['tyi', 'ちぃ'], ['tyu', 'ちゅ'], ['tye', 'ちぇ'], ['tyo', 'ちょ'],
  ['cya', 'ちゃ'], ['cyi', 'ちぃ'], ['cyu', 'ちゅ'], ['cye', 'ちぇ'], ['cyo', 'ちょ'],
  ['kya', 'きゃ'], ['kyi', 'きぃ'], ['kyu', 'きゅ'], ['kye', 'きぇ'], ['kyo', 'きょ'],
  ['gya', 'ぎゃ'], ['gyi', 'ぎぃ'], ['gyu', 'ぎゅ'], ['gye', 'ぎぇ'], ['gyo', 'ぎょ'],
  ['nya', 'にゃ'], ['nyi', 'にぃ'], ['nyu', 'にゅ'], ['nye', 'にぇ'], ['nyo', 'にょ'],
  ['hya', 'ひゃ'], ['hyi', 'ひぃ'], ['hyu', 'ひゅ'], ['hye', 'ひぇ'], ['hyo', 'ひょ'],
  ['bya', 'びゃ'], ['byi', 'びぃ'], ['byu', 'びゅ'], ['bye', 'びぇ'], ['byo', 'びょ'],
  ['pya', 'ぴゃ'], ['pyi', 'ぴぃ'], ['pyu', 'ぴゅ'], ['pye', 'ぴぇ'], ['pyo', 'ぴょ'],
  ['mya', 'みゃ'], ['myi', 'みぃ'], ['myu', 'みゅ'], ['mye', 'みぇ'], ['myo', 'みょ'],
  ['rya', 'りゃ'], ['ryi', 'りぃ'], ['ryu', 'りゅ'], ['rye', 'りぇ'], ['ryo', 'りょ'],
  ['jya', 'じゃ'], ['jyu', 'じゅ'], ['jyo', 'じょ'],
  ['dya', 'ぢゃ'], ['dyi', 'ぢぃ'], ['dyu', 'ぢゅ'], ['dye', 'ぢぇ'], ['dyo', 'ぢょ'],

  // Two-char combos
  ['ka', 'か'], ['ki', 'き'], ['ku', 'く'], ['ke', 'け'], ['ko', 'こ'],
  ['sa', 'さ'], ['si', 'し'], ['su', 'す'], ['se', 'せ'], ['so', 'そ'],
  ['ta', 'た'], ['ti', 'ち'], ['tu', 'つ'], ['te', 'て'], ['to', 'と'],
  ['na', 'な'], ['ni', 'に'], ['nu', 'ぬ'], ['ne', 'ね'], ['no', 'の'],
  ['ha', 'は'], ['hi', 'ひ'], ['hu', 'ふ'], ['he', 'へ'], ['ho', 'ほ'],
  ['fu', 'ふ'],
  ['ma', 'ま'], ['mi', 'み'], ['mu', 'む'], ['me', 'め'], ['mo', 'も'],
  ['ya', 'や'], ['yi', 'い'], ['yu', 'ゆ'], ['ye', 'いぇ'], ['yo', 'よ'],
  ['ra', 'ら'], ['ri', 'り'], ['ru', 'る'], ['re', 'れ'], ['ro', 'ろ'],
  ['wa', 'わ'], ['wi', 'ゐ'], ['we', 'ゑ'], ['wo', 'を'],
  ['ga', 'が'], ['gi', 'ぎ'], ['gu', 'ぐ'], ['ge', 'げ'], ['go', 'ご'],
  ['za', 'ざ'], ['zi', 'じ'], ['zu', 'ず'], ['ze', 'ぜ'], ['zo', 'ぞ'],
  ['ja', 'じゃ'], ['ji', 'じ'], ['ju', 'じゅ'], ['je', 'じぇ'], ['jo', 'じょ'],
  ['da', 'だ'], ['di', 'ぢ'], ['du', 'づ'], ['de', 'で'], ['do', 'ど'],
  ['ba', 'ば'], ['bi', 'び'], ['bu', 'ぶ'], ['be', 'べ'], ['bo', 'ぼ'],
  ['pa', 'ぱ'], ['pi', 'ぴ'], ['pu', 'ぷ'], ['pe', 'ぺ'], ['po', 'ぽ'],
  ['nn', 'ん'],
  ['xa', 'ぁ'], ['xi', 'ぃ'], ['xu', 'ぅ'], ['xe', 'ぇ'], ['xo', 'ぉ'],
  ['la', 'ぁ'], ['li', 'ぃ'], ['lu', 'ぅ'], ['le', 'ぇ'], ['lo', 'ぉ'],

  // Single-char vowels
  ['a', 'あ'], ['i', 'い'], ['u', 'う'], ['e', 'え'], ['o', 'お'],
])

/** Set of consonants that can start a valid romaji sequence */
const CONSONANT_STARTERS = new Set('kstnhmyrwgzjdbpfcxl')

/** Characters that can follow 'n' to form a multi-char sequence (not ん) */
const N_CONTINUES = new Set('aiueoynh')

/**
 * Check if a buffer could potentially match a romaji sequence with more characters.
 * Returns true if the buffer is a valid prefix of any mapping key.
 */
function isPotentialPrefix(buffer: string): boolean {
  for (const key of ROMAJI_MAP.keys()) {
    if (key.startsWith(buffer) && key.length > buffer.length) return true
  }
  return false
}

/**
 * Convert a romaji input string to hiragana.
 * Returns { kana, pending } where:
 * - kana: the converted hiragana output
 * - pending: unconsumed romaji characters that could still form a match
 */
export function romajiToKana(input: string): { kana: string; pending: string } {
  let result = ''
  let buffer = ''

  for (let i = 0; i < input.length; i++) {
    const ch = input[i].toLowerCase()

    // Pass through existing kana / non-ascii
    if (ch.charCodeAt(0) > 0x7e) {
      if (buffer === 'n') {
        result += 'ん'
        buffer = ''
      } else if (buffer.length > 0) {
        result += buffer
        buffer = ''
      }
      result += ch
      continue
    }

    buffer += ch

    // Double consonant → っ + keep second consonant
    if (
      buffer.length === 2 &&
      buffer[0] === buffer[1] &&
      CONSONANT_STARTERS.has(buffer[0]) &&
      buffer[0] !== 'n' // nn → ん handled by map
    ) {
      result += 'っ'
      buffer = buffer[1]
      continue
    }

    // Try longest match first (4, 3, 2, 1)
    let matched = false
    for (let len = Math.min(buffer.length, 4); len >= 1; len--) {
      const trySeq = buffer.substring(0, len)
      const kana = ROMAJI_MAP.get(trySeq)
      if (kana !== undefined) {
        // Special case for single 'n': only convert if next char isn't a vowel/y/n
        if (trySeq === 'n' && len === 1) {
          // Check if there's more in the buffer that could extend
          if (buffer.length > 1 && N_CONTINUES.has(buffer[1])) {
            continue // Don't match 'n' alone; let it grow
          }
        }
        result += kana
        buffer = buffer.substring(len)
        matched = true
        break
      }
    }

    // If nothing matched and buffer can't possibly lead to a match, flush
    if (!matched && !isPotentialPrefix(buffer)) {
      // 'n' at start of dead-end buffer → ん
      if (buffer.length >= 2 && buffer[0] === 'n' && !N_CONTINUES.has(buffer[1])) {
        result += 'ん'
        buffer = buffer.substring(1)
        i-- // re-process current char
      } else if (!CONSONANT_STARTERS.has(buffer[0]) && !ROMAJI_MAP.has(buffer[0])) {
        // Non-romaji character, pass through
        result += buffer[0]
        buffer = buffer.substring(1)
        i-- // re-process
      }
    }
  }

  return { kana: result, pending: buffer }
}

/**
 * Finalize conversion — flush any remaining 'n' as ん.
 * Call this when the user submits their answer.
 */
export function romajiToKanaFinal(input: string): string {
  const { kana, pending } = romajiToKana(input)
  if (pending === 'n') return kana + 'ん'
  return kana + pending
}
