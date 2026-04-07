import { useState } from 'react'
import { loadSettings, saveSettings } from '@/core/storage/settings'
import { markOnboarded } from '@/core/storage/onboarding'
import styles from './Onboarding.module.css'

interface OnboardingProps {
  onComplete: () => void
}

const PACE_OPTIONS = [
  { value: 5, label: '5 per day', desc: 'Relaxed — about 14 months' },
  { value: 10, label: '10 per day', desc: 'Balanced — about 7 months', recommended: true },
  { value: 20, label: '20 per day', desc: 'Intensive — about 4 months' },
] as const

type GuidePhase = 'front' | 'back' | 'rated' | 'done'

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [pace, setPace] = useState(10)
  const [guidePhase, setGuidePhase] = useState<GuidePhase>('front')

  function handleFinish() {
    const settings = loadSettings()
    settings.dailyNewCards = pace
    saveSettings(settings)
    markOnboarded()
    onComplete()
  }

  return (
    <div className={styles.container}>
      {step === 0 && (
        <div className={styles.step}>
          <div className={styles.hero}>漢字練習</div>
          <h2 className={styles.title}>Kanji Renshū</h2>
          <p className={styles.body}>
            Master all 2,136 official Japanese kanji with spaced repetition.
          </p>
          <p className={styles.body}>
            The app introduces new kanji daily and schedules reviews
            at the optimal time for long-term memory.
          </p>
          <button className={styles.primaryButton} onClick={() => setStep(1)}>
            Get Started
          </button>
        </div>
      )}

      {step === 1 && (
        <div className={styles.step}>
          <h2 className={styles.title}>Choose your pace</h2>
          <p className={styles.bodySmall}>How many new kanji per day?</p>
          <div className={styles.options}>
            {PACE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`${styles.option} ${pace === opt.value ? styles.optionActive : ''}`}
                onClick={() => setPace(opt.value)}
                type="button"
              >
                <span className={styles.optionLabel}>{opt.label}</span>
                <span className={styles.optionDesc}>{opt.desc}</span>
                {'recommended' in opt && <span className={styles.badge}>Recommended</span>}
              </button>
            ))}
          </div>
          <p className={styles.hint}>You can change this anytime in Settings.</p>
          <button className={styles.primaryButton} onClick={() => setStep(2)}>
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className={styles.step}>
          <h2 className={styles.title}>Try your first card</h2>

          {guidePhase === 'front' && (
            <>
              <p className={styles.coach}>
                This is a kanji. Tap the card to see its reading and meaning.
              </p>
              <div
                className={styles.demoCard}
                onClick={() => setGuidePhase('back')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') setGuidePhase('back')
                }}
              >
                <span className={styles.demoKanji}>一</span>
                <span className={styles.demoHint}>Tap to reveal</span>
              </div>
            </>
          )}

          {guidePhase === 'back' && (
            <>
              <p className={styles.coach}>
                Now rate how well you knew it. Don&apos;t worry — this is just practice!
              </p>
              <div className={styles.demoCardBack}>
                <span className={styles.demoKanjiSmall}>一</span>
                <span className={styles.demoReading}>イチ · ひと.つ</span>
                <span className={styles.demoMeaning}>one</span>
              </div>
              <div className={styles.demoRatings}>
                {['Again', 'Hard', 'Good', 'Easy'].map((label) => (
                  <button
                    key={label}
                    className={`${styles.demoRating} ${styles[`demoRating${label}` as keyof typeof styles] ?? ''}`}
                    onClick={() => setGuidePhase('rated')}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}

          {guidePhase === 'rated' && (
            <>
              <div className={styles.celebration}>🎉</div>
              <p className={styles.body}>
                Great! The app will show you this kanji again at the perfect time
                for long-term memory.
              </p>
              <p className={styles.bodySmall}>
                4 study modes available:
              </p>
              <div className={styles.modes}>
                <span className={styles.modeChip}>📖 Flashcards</span>
                <span className={styles.modeChip}>意 Meaning Quiz</span>
                <span className={styles.modeChip}>読 Reading Quiz</span>
                <span className={styles.modeChip}>書 Writing Practice</span>
              </div>
              <button className={styles.primaryButton} onClick={handleFinish}>
                Start Learning
              </button>
            </>
          )}
        </div>
      )}

      <div className={styles.dots}>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className={`${styles.dot} ${i === step ? styles.dotActive : ''}`}
          />
        ))}
      </div>
    </div>
  )
}
