import { useState, useCallback, useRef, useEffect } from 'react'
import { romajiToKana } from '@/utils/romaji'
import styles from './RomajiInput.module.css'

interface RomajiInputProps {
  onChange: (kana: string, raw: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  ariaLabel?: string
  autoFocus?: boolean
}

/** Check whether a string contains any non-ASCII character. */
function hasNonAscii(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 126) return true
  }
  return false
}

/**
 * An input that converts romaji keystrokes to hiragana in real-time.
 * Displays the converted kana as the main value, with a small
 * pending indicator showing unconsumed romaji chars.
 *
 * Reset by giving this component a new `key` from the parent.
 */
export function RomajiInput({
  onChange,
  placeholder,
  disabled,
  className,
  ariaLabel,
  autoFocus,
}: RomajiInputProps) {
  const [rawInput, setRawInput] = useState('')
  const [pending, setPending] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newRaw = e.target.value

      // If user typed kana directly (e.g. mobile keyboard), pass through
      if (hasNonAscii(newRaw)) {
        setRawInput(newRaw)
        setPending('')
        onChange(newRaw, newRaw)
        return
      }

      setRawInput(newRaw)
      const { kana, pending: pend } = romajiToKana(newRaw)
      setPending(pend)
      onChange(kana + pend, newRaw)
    },
    [onChange],
  )

  return (
    <div className={styles.wrapper}>
      <input
        ref={inputRef}
        className={`${styles.input} ${className ?? ''}`}
        type="text"
        value={rawInput}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label={ariaLabel}
      />
      {pending && <span className={styles.pending}>{pending}</span>}
    </div>
  )
}
