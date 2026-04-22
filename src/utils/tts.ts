/**
 * Thin wrapper around the Web Speech `speechSynthesis` API for Japanese TTS.
 *
 * - `speak(text)` is a no-op when the user has not enabled TTS, when the
 *   browser lacks SpeechSynthesis support, or when no `ja-JP` voice is
 *   available. It silently degrades — never throws.
 * - Voice selection is lazy: the list of voices is loaded async by the
 *   browser, so we resolve the best Japanese voice on first use and cache it.
 * - Always cancels any in-flight utterance before queuing a new one so taps
 *   feel responsive.
 */

import { loadSettings } from '@/core/storage/settings'

let cachedVoice: SpeechSynthesisVoice | null | undefined

function pickJapaneseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null
  // Prefer Google/native ja-JP, fall back to any ja-* voice.
  const ja = voices.filter(v => v.lang?.toLowerCase().startsWith('ja'))
  if (ja.length === 0) return null
  return ja.find(v => v.localService) ?? ja[0]
}

function ensureVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice
  cachedVoice = pickJapaneseVoice()
  if (cachedVoice === null && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    // Voices may load asynchronously — refresh the cache once they arrive.
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      cachedVoice = pickJapaneseVoice()
    }, { once: true })
  }
  return cachedVoice
}

export function isTtsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function isTtsAvailable(): boolean {
  if (!isTtsSupported()) return false
  return ensureVoice() !== null
}

/** Speak the given Japanese text. No-op if TTS disabled or unsupported. */
export function speak(text: string, opts: { force?: boolean } = {}): void {
  if (!isTtsSupported() || !text.trim()) return
  if (!opts.force && !loadSettings().ttsEnabled) return
  const voice = ensureVoice()
  if (!voice) return

  const synth = window.speechSynthesis
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.voice = voice
  utterance.lang = 'ja-JP'
  utterance.rate = 0.9
  utterance.pitch = 1
  synth.speak(utterance)
}

export function stopSpeaking(): void {
  if (!isTtsSupported()) return
  window.speechSynthesis.cancel()
}
