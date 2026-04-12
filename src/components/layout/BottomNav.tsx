import { useState } from 'react'
import { useTranslation } from '@/i18n'
import styles from './BottomNav.module.css'

interface BottomNavProps {
  currentView: string
  onNavigate: (view: string) => void
}

const STUDY_VIEWS = ['review', 'meaning-quiz', 'reading-quiz', 'writing']

export function BottomNav({ currentView, onNavigate }: BottomNavProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const { t } = useTranslation()
  const isStudy = STUDY_VIEWS.includes(currentView)
  const isHome = currentView === 'home' || isStudy

  const STUDY_MODES = [
    { view: 'review', icon: '📖', label: t('mode.flashcards'), desc: t('mode.flashcards.desc') },
    { view: 'meaning-quiz', icon: '🔤', label: t('mode.meaningQuiz'), desc: t('mode.meaningQuiz.desc') },
    { view: 'reading-quiz', icon: '🗣️', label: t('mode.readingQuiz'), desc: t('mode.readingQuiz.desc') },
    { view: 'writing', icon: '✍️', label: t('mode.writing'), desc: t('mode.writingPractice.desc') },
  ]

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
          className={`${styles.tab} ${isHome ? styles.tabActive : ''}`}
          onClick={() => onNavigate('home')}
          type="button"
        >
          <span className={styles.tabIcon}>🏠</span>
          {t('nav.home')}
        </button>
        <button
          className={`${styles.tab} ${isStudy ? styles.tabActive : ''}`}
          onClick={handleStudyTap}
          type="button"
        >
          <span className={styles.tabIcon}>📖</span>
          {t('nav.study')}
        </button>
        <button
          className={`${styles.tab} ${currentView === 'browse' ? styles.tabActive : ''}`}
          onClick={() => onNavigate('browse')}
          type="button"
        >
          <span className={styles.tabIcon}>📚</span>
          {t('nav.browse')}
        </button>
        <button
          className={`${styles.tab} ${currentView === 'progress' ? styles.tabActive : ''}`}
          onClick={() => onNavigate('progress')}
          type="button"
        >
          <span className={styles.tabIcon}>📊</span>
          {t('nav.progress')}
        </button>
        <button
          className={`${styles.tab} ${currentView === 'settings' ? styles.tabActive : ''}`}
          onClick={() => onNavigate('settings')}
          type="button"
        >
          <span className={styles.tabIcon}>⚙️</span>
          {t('nav.settings')}
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
            <div className={styles.sheetTitle}>{t('nav.studyMode')}</div>
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
