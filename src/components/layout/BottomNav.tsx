import styles from './BottomNav.module.css'

interface BottomNavProps {
  currentView: string
  onNavigate: (view: string) => void
}

const STUDY_VIEWS = ['home', 'review', 'meaning-quiz', 'reading-quiz', 'writing']

export function BottomNav({ currentView, onNavigate }: BottomNavProps) {
  const isHome = STUDY_VIEWS.includes(currentView)

  return (
    <>
      <nav className={styles.bottomNav} aria-label="Main navigation">
        <button
          className={`${styles.tab} ${isHome ? styles.tabActive : ''}`}
          onClick={() => onNavigate('home')}
          type="button"
        >
          <span className={styles.tabIcon}>🏠</span>
          Home
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
    </>
  )
}
