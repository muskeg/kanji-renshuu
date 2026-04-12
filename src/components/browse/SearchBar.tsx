import { useState } from 'react'
import { useTranslation } from '@/i18n'
import styles from './SearchBar.module.css'

interface SearchBarProps {
  value: string
  onChange: (query: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  const [focused, setFocused] = useState(false)
  const { t } = useTranslation()

  return (
    <div className={`${styles.wrapper} ${focused ? styles.focused : ''}`}>
      <svg className={styles.icon} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        className={styles.input}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder ?? t('browse.searchPlaceholder')}
        aria-label={t('browse.searchLabel')}
      />
      {value && (
        <button
          className={styles.clear}
          onClick={() => onChange('')}
          aria-label={t('browse.clearSearch')}
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  )
}
