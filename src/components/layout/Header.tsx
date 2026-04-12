import { useState, useRef, useEffect } from 'react'
import { StatusBar } from './StatusBar'
import { useTheme } from '@/hooks/useTheme'
import styles from './Header.module.css'

interface HeaderProps {
  currentView: string
  onNavigate: (view: string) => void
}

const STUDY_VIEWS = ['review', 'meaning-quiz', 'reading-quiz', 'writing']

export function Header({ currentView, onNavigate }: HeaderProps) {
  const [studyOpen, setStudyOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const brandRef = useRef<HTMLDivElement>(null)
  const isStudyView = STUDY_VIEWS.includes(currentView)
  const { effectiveTheme, cycleTheme } = useTheme()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setStudyOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Click brand to go home
  useEffect(() => {
    const el = brandRef.current
    if (!el) return
    const handler = () => onNavigate('home')
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [onNavigate])

  return (
    <>
    <header className={styles.header}>
      <div className={styles.brand} ref={brandRef} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
        <span className={styles.logo}>漢</span>
        <div>
          <div className={styles.title}>Kanji Renshū</div>
          <div className={styles.subtitle}>漢字練習</div>
        </div>
      </div>

      <nav className={styles.nav} aria-label="Main navigation">
        <button
          className={`${styles.navButton} ${currentView === 'home' ? styles.navButtonActive : ''}`}
          onClick={() => onNavigate('home')}
        >
          Home
        </button>
        <div className={styles.dropdown} ref={dropdownRef}>
          <button
            className={`${styles.navButton} ${isStudyView ? styles.navButtonActive : ''}`}
            onClick={() => setStudyOpen(!studyOpen)}
            aria-expanded={studyOpen}
            aria-haspopup="true"
          >
            Study ▾
          </button>
          {studyOpen && (
            <div className={styles.dropdownMenu}>
              <button
                className={`${styles.dropdownItem} ${currentView === 'review' ? styles.dropdownItemActive : ''}`}
                onClick={() => { onNavigate('review'); setStudyOpen(false) }}
              >
                Flashcards
              </button>
              <button
                className={`${styles.dropdownItem} ${currentView === 'meaning-quiz' ? styles.dropdownItemActive : ''}`}
                onClick={() => { onNavigate('meaning-quiz'); setStudyOpen(false) }}
              >
                Meaning Quiz
              </button>
              <button
                className={`${styles.dropdownItem} ${currentView === 'reading-quiz' ? styles.dropdownItemActive : ''}`}
                onClick={() => { onNavigate('reading-quiz'); setStudyOpen(false) }}
              >
                Reading Quiz
              </button>
              <button
                className={`${styles.dropdownItem} ${currentView === 'writing' ? styles.dropdownItemActive : ''}`}
                onClick={() => { onNavigate('writing'); setStudyOpen(false) }}
              >
                Writing Practice
              </button>
            </div>
          )}
        </div>
        <button
          className={`${styles.navButton} ${currentView === 'browse' ? styles.navButtonActive : ''}`}
          onClick={() => onNavigate('browse')}
        >
          Browse
        </button>
        <button
          className={`${styles.navButton} ${currentView === 'progress' ? styles.navButtonActive : ''}`}
          onClick={() => onNavigate('progress')}
        >
          Progress
        </button>
        <button
          className={styles.navButton}
          onClick={cycleTheme}
          aria-label={`Theme: ${effectiveTheme}`}
          title={`Theme: ${effectiveTheme}`}
        >
          {effectiveTheme === 'dark' ? '🌙' : '☀️'}
        </button>
        <button
          className={`${styles.navButton} ${currentView === 'settings' ? styles.navButtonActive : ''}`}
          onClick={() => onNavigate('settings')}
        >
          ⚙
        </button>
      </nav>
    </header>
    <StatusBar />
    </>
  )
}
