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

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [pace, setPace] = useState(10)

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
          <h2 className={styles.title}>How studying works</h2>
          <ol className={styles.steps}>
            <li className={styles.stepItem}>
              <span className={styles.stepNum}>1</span>
              <span>See a kanji — try to recall its meaning and reading</span>
            </li>
            <li className={styles.stepItem}>
              <span className={styles.stepNum}>2</span>
              <span>Tap the card to reveal the answer</span>
            </li>
            <li className={styles.stepItem}>
              <span className={styles.stepNum}>3</span>
              <span>Rate how well you remembered (Again / Hard / Good / Easy)</span>
            </li>
          </ol>
          <p className={styles.body}>
            The app uses spaced repetition to show harder kanji more often
            and easier ones less frequently.
          </p>
          <div className={styles.modes}>
            <span className={styles.modeChip}>📖 Flashcards</span>
            <span className={styles.modeChip}>意 Meaning Quiz</span>
            <span className={styles.modeChip}>読 Reading Quiz</span>
            <span className={styles.modeChip}>書 Writing Practice</span>
          </div>
          <button className={styles.primaryButton} onClick={handleFinish}>
            Start Your First Session
          </button>
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
