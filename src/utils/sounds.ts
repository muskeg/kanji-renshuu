import { loadSettings } from '@/core/storage/settings'

let audioCtx: AudioContext | null = null

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

function isEnabled(): boolean {
  return loadSettings().soundEnabled
}

/** Soft whoosh for card flip */
export function playFlipSound(): void {
  if (!isEnabled()) return
  const ctx = getContext()
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(800, ctx.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15)
  gain.gain.setValueAtTime(0.08, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
  oscillator.connect(gain).connect(ctx.destination)
  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + 0.15)
}

/** Gentle chime for correct answer */
export function playCorrectSound(): void {
  if (!isEnabled()) return
  const ctx = getContext()
  const now = ctx.currentTime

  const notes = [523.25, 659.25] // C5, E5
  for (let i = 0; i < notes.length; i++) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = notes[i]!
    gain.gain.setValueAtTime(0, now + i * 0.1)
    gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now + i * 0.1)
    osc.stop(now + i * 0.1 + 0.3)
  }
}

/** Celebration sound for session complete */
export function playCelebrationSound(): void {
  if (!isEnabled()) return
  const ctx = getContext()
  const now = ctx.currentTime

  const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
  for (let i = 0; i < notes.length; i++) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = notes[i]!
    gain.gain.setValueAtTime(0, now + i * 0.12)
    gain.gain.linearRampToValueAtTime(0.12, now + i * 0.12 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now + i * 0.12)
    osc.stop(now + i * 0.12 + 0.5)
  }
}

/** Short fanfare for milestone */
export function playMilestoneSound(): void {
  if (!isEnabled()) return
  const ctx = getContext()
  const now = ctx.currentTime

  const notes = [392, 523.25, 659.25, 783.99, 1046.5] // G4, C5, E5, G5, C6
  for (let i = 0; i < notes.length; i++) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = notes[i]!
    gain.gain.setValueAtTime(0, now + i * 0.1)
    gain.gain.linearRampToValueAtTime(0.15, now + i * 0.1 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.6)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now + i * 0.1)
    osc.stop(now + i * 0.1 + 0.6)
  }
}
