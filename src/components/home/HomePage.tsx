import type { KanjiEntry } from '@/core/srs/types'
import { Onboarding } from '@/components/onboarding/Onboarding'
import { isOnboarded } from '@/core/storage/onboarding'
import { DailyGoal } from '@/components/review/DailyGoal'
import { StreakRecovery } from '@/components/review/StreakRecovery'
import { KanjiOfTheDay } from '@/components/review/KanjiOfTheDay'
import { useTranslation } from '@/i18n'
import styles from './HomePage.module.css'

interface HomePageProps {
  kanjiData: KanjiEntry[]
  onNavigate: (view: string) => void
}

export function HomePage({ kanjiData, onNavigate }: HomePageProps) {
  const { t } = useTranslation()

  const STUDY_MODES = [
    { view: 'review', icon: '📖', label: t('mode.flashcards'), desc: t('mode.flashcards.descShort') },
    { view: 'meaning-quiz', icon: '🔤', label: t('mode.meaningQuiz'), desc: t('mode.meaningQuiz.descShort') },
    { view: 'reading-quiz', icon: '🗣️', label: t('mode.readingQuiz'), desc: t('mode.readingQuiz.descShort') },
    { view: 'writing', icon: '✍️', label: t('mode.writing'), desc: t('mode.writingPractice.desc') },
  ]

  // First-time users see the onboarding flow
  if (!isOnboarded()) {
    return <Onboarding onComplete={() => onNavigate('review')} />
  }

  return (
    <div className={styles.container}>
      <StreakRecovery />

      {/* Daily progress */}
      <DailyGoal onReview={() => onNavigate('review')} />

      {/* Study modes grid */}
      <section className={styles.modesSection}>
        <h3 className={styles.sectionTitle}>{t('home.studyModes')}</h3>
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
