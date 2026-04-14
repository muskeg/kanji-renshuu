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
  // Track raw romaji separately so we can derive kana display
  const rawRef = useRef('')
  const [displayValue, setDisplayValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDisplay = e.target.value

      // If user typed kana directly (e.g. mobile keyboard), pass through
      if (hasNonAscii(newDisplay)) {
        rawRef.current = newDisplay
        setDisplayValue(newDisplay)
        onChange(newDisplay, newDisplay)
        return
      }

      // Detect what changed: compare new display to old to find the raw edit
      const oldRaw = rawRef.current
      const oldDisplay = displayValue

      // Figure out how many characters were added/removed at the end
      // by comparing the display values
      const commonLen = findCommonPrefixLength(oldDisplay, newDisplay)
      const removedFromOld = oldDisplay.length - commonLen
      const addedInNew = newDisplay.substring(commonLen)

      // Map the edit back to raw romaji:
      // Remove characters from end of raw corresponding to removed display chars
      let newRaw: string
      if (removedFromOld > 0) {
        // User deleted — remove from raw end. We need to figure out how many
        // raw chars to remove. Rebuild from scratch by trimming raw.
        // Since kana chars replace multiple raw chars, trim raw to find a
        // matching prefix, then append what was added.
        newRaw = trimRawForDisplay(oldRaw, removedFromOld) + addedInNew
      } else {
        newRaw = oldRaw + addedInNew
      }

      rawRef.current = newRaw
      const { kana, pending } = romajiToKana(newRaw)
      const composed = kana + pending
      setDisplayValue(composed)
      onChange(composed, newRaw)
    },
    [onChange, displayValue],
  )

  return (
    <div className={styles.wrapper}>
      <input
        ref={inputRef}
        className={`${styles.input} ${className ?? ''}`}
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label={ariaLabel}
      />
    </div>
  )
}

/** Find length of common prefix between two strings. */
function findCommonPrefixLength(a: string, b: string): number {
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) return i
  }
  return len
}

/**
 * When the user deletes N display characters from the end,
 * figure out how many raw romaji characters to remove.
 * We do this by progressively trimming the raw string until
 * the converted output is short enough.
 */
function trimRawForDisplay(raw: string, displayCharsToRemove: number): string {
  // Get current display length from the raw
  const { kana, pending } = romajiToKana(raw)
  const currentDisplay = kana + pending
  const targetLen = currentDisplay.length - displayCharsToRemove

  if (targetLen <= 0) return ''

  // Trim raw from the end until display length matches target
  let trimmed = raw
  while (trimmed.length > 0) {
    trimmed = trimmed.slice(0, -1)
    const result = romajiToKana(trimmed)
    const display = result.kana + result.pending
    if (display.length <= targetLen) return trimmed
  }
  return ''
}
