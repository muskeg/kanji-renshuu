import { useState } from 'react'
import { isTtsSupported, speak } from '@/utils/tts'
import { useTranslation } from '@/i18n'
import styles from './SpeakerButton.module.css'

interface SpeakerButtonProps {
  text: string
  /** When true, ignore the global TTS toggle (user explicitly asked). */
  forceOnTap?: boolean
  size?: 'sm' | 'md'
}

/**
 * Small speaker icon button that speaks `text` via the Web Speech API.
 *
 * Hidden entirely when the browser lacks SpeechSynthesis support, so we don't
 * surface a control that can't do anything.
 */
export function SpeakerButton({ text, forceOnTap = true, size = 'sm' }: SpeakerButtonProps) {
  const { t } = useTranslation()
  const [pulsing, setPulsing] = useState(false)
  if (!isTtsSupported()) return null

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    speak(text, { force: forceOnTap })
    setPulsing(true)
    window.setTimeout(() => setPulsing(false), 400)
  }

  return (
    <button
      type="button"
      className={`${styles.button} ${styles[size]} ${pulsing ? styles.pulsing : ''}`}
      onClick={handleClick}
      aria-label={t('appearance.ttsPlay')}
      title={t('appearance.ttsPlay')}
    >
      <span aria-hidden="true">🔊</span>
    </button>
  )
}
