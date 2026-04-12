import type { KanjiEntry } from '@/core/srs/types'
import { Onboarding } from '@/components/onboarding/Onboarding'
import { isOnboarded } from '@/core/storage/onboarding'
import { DailyGoal } from '@/components/review/DailyGoal'
import { StreakRecovery } from '@/components/review/StreakRecovery'
import { KanjiOfTheDay } from '@/components/review/KanjiOfTheDay'
import styles from './HomePage.module.css'

interface HomePageProps {
  kanjiData: KanjiEntry[]
  onNavigate: (view: string) => void
}

const STUDY_MODES = [
  { view: 'review', icon: '📖', label: 'Flashcards', desc: 'Recall reading & meaning' },
  { view: 'meaning-quiz', icon: '🔤', label: 'Meaning Quiz', desc: 'Pick the kanji from meaning' },
  { view: 'reading-quiz', icon: '🗣️', label: 'Reading Quiz', desc: 'Type the reading' },
  { view: 'writing', icon: '✍️', label: 'Writing', desc: 'Practice strokes' },
] as const

export function HomePage({ kanjiData, onNavigate }: HomePageProps) {
  // First-time users see the onboarding flow
  if (!isOnboarded()) {
    return <Onboarding onComplete={() => onNavigate('review')} />
  }

  return (
    <div className={styles.container}>
      <StreakRecovery />

      {/* Daily progress */}
      <DailyGoal />

      {/* Study modes grid */}
      <section className={styles.modesSection}>
        <h3 className={styles.sectionTitle}>Study Modes</h3>
        <div className={styles.modesGrid}>
          {STUDY_MODES.map(mode => (
            <button
              key={mode.view}
              className={styles.modeCard}
              onClick={() => onNavigate(mode.view)}
            >
              <span className={styles.modeIcon}>{mode.icon}</span>
              <span className={styles.modeLabel}>{mode.label}</span>
              <span className={styles.modeDesc}>{mode.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Kanji of the Day */}
      <KanjiOfTheDay kanjiData={kanjiData} />
    </div>
  )
}
