import { useState, useCallback, useRef, useEffect } from 'react'
import { romajiToKana } from '@/utils/romaji'
import styles from './RomajiInput.module.css'

interface RomajiInputProps {
  value: string
  onChange: (kana: string, raw: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  ariaLabel?: string
  autoFocus?: boolean
}

/**
 * An input that converts romaji keystrokes to hiragana in real-time.
 * Displays the converted kana as the main value, with a small
 * pending indicator showing unconsumed romaji chars.
 */
export function RomajiInput({
  value,
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
  const prevValueRef = useRef(value)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Reset internal state when value is cleared externally
  if (value === '' && prevValueRef.current !== '') {
    setRawInput('')
    setPending('')
  }
  prevValueRef.current = value

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newRaw = e.target.value

      // If user typed kana directly (e.g. mobile keyboard), pass through
      const hasNonAscii = /[^\u0000-\u007e]/.test(newRaw)
      if (hasNonAscii) {
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
