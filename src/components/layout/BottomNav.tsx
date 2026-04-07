import { useState } from 'react'
import styles from './BottomNav.module.css'

interface BottomNavProps {
  currentView: string
  onNavigate: (view: string) => void
}

const STUDY_VIEWS = ['review', 'meaning-quiz', 'reading-quiz', 'writing']

const STUDY_MODES = [
  { view: 'review', icon: '📖', label: 'Flashcards', desc: 'See kanji, recall reading & meaning' },
  { view: 'meaning-quiz', icon: '🔤', label: 'Meaning Quiz', desc: 'See English meaning, pick the kanji' },
  { view: 'reading-quiz', icon: '🗣️', label: 'Reading Quiz', desc: 'See kanji, type the reading' },
  { view: 'writing', icon: '✍️', label: 'Writing', desc: 'Practice writing strokes' },
]

export function BottomNav({ currentView, onNavigate }: BottomNavProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const isStudy = STUDY_VIEWS.includes(currentView)

  function handleStudyTap() {
    if (isStudy) {
      setSheetOpen(true)
    } else {
      onNavigate('review')
    }
  }

  function selectMode(view: string) {
    onNavigate(view)
    setSheetOpen(false)
  }

  return (
    <>
      <nav className={styles.bottomNav} aria-label="Main navigation">
        <button
          className={`${styles.tab} ${isStudy ? styles.tabActive : ''}`}
          onClick={handleStudyTap}
          type="button"
        >
          <span className={styles.tabIcon}>📖</span>
          Study
        </button>
        <button
          className={`${styles.tab} ${currentView === 'browse' ? styles.tabActive : ''}`}
          onClick={() => onNavigate('browse')}
          type="button"
        >
          <span className={styles.tabIcon}>📚</span>
          Browse
        </button>
        <button
          className={`${styles.tab} ${currentView === 'progress' ? styles.tabActive : ''}`}
          onClick={() => onNavigate('progress')}
          type="button"
        >
          <span className={styles.tabIcon}>📊</span>
          Progress
        </button>
        <button
          className={`${styles.tab} ${currentView === 'settings' ? styles.tabActive : ''}`}
          onClick={() => onNavigate('settings')}
          type="button"
        >
          <span className={styles.tabIcon}>⚙️</span>
          Settings
        </button>
      </nav>

      {/* Study mode bottom sheet */}
      {sheetOpen && (
        <>
          <div
            className={styles.overlay}
            onClick={() => setSheetOpen(false)}
            role="presentation"
          />
          <div className={styles.sheet} role="dialog" aria-label="Study modes">
            <div className={styles.sheetHandle} />
            <div className={styles.sheetTitle}>Study Mode</div>
            {STUDY_MODES.map(mode => (
              <button
                key={mode.view}
                className={`${styles.sheetItem} ${currentView === mode.view ? styles.sheetItemActive : ''}`}
                onClick={() => selectMode(mode.view)}
                type="button"
              >
                <span className={styles.sheetItemIcon}>{mode.icon}</span>
                <span className={styles.sheetItemText}>
                  <span className={styles.sheetItemLabel}>{mode.label}</span>
                  <span className={styles.sheetItemDesc}>{mode.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}
