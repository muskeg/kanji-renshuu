import { useState } from 'react'
import { loadSettings, saveSettings } from '@/core/storage/settings'
import { markOnboarded } from '@/core/storage/onboarding'
import { useTranslation } from '@/i18n'
import styles from './Onboarding.module.css'

interface OnboardingProps {
  onComplete: () => void
}

const PACE_OPTIONS = [
  { value: 5, labelKey: 'onboarding.5perDay' as const, descKey: 'onboarding.5perDayDesc' as const },
  { value: 10, labelKey: 'onboarding.10perDay' as const, descKey: 'onboarding.10perDayDesc' as const, recommended: true },
  { value: 20, labelKey: 'onboarding.20perDay' as const, descKey: 'onboarding.20perDayDesc' as const },
] as const

type GuidePhase = 'front' | 'back' | 'rated' | 'done'

export function Onboarding({ onComplete }: OnboardingProps) {
  const { t } = useTranslation()
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
          <h2 className={styles.title}>{t('onboarding.title')}</h2>
          <p className={styles.body}>
            {t('onboarding.intro1')}
          </p>
          <p className={styles.body}>
            {t('onboarding.intro2')}
          </p>
          <button className={styles.primaryButton} onClick={() => setStep(1)}>
            {t('onboarding.getStarted')}
          </button>
        </div>
      )}

      {step === 1 && (
        <div className={styles.step}>
          <h2 className={styles.title}>{t('onboarding.choosePace')}</h2>
          <p className={styles.bodySmall}>{t('onboarding.howMany')}</p>
          <div className={styles.options}>
            {PACE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`${styles.option} ${pace === opt.value ? styles.optionActive : ''}`}
                onClick={() => setPace(opt.value)}
                type="button"
              >
                <span className={styles.optionLabel}>{t(opt.labelKey)}</span>
                <span className={styles.optionDesc}>{t(opt.descKey)}</span>
                {'recommended' in opt && <span className={styles.badge}>{t('onboarding.recommended')}</span>}
              </button>
            ))}
          </div>
          <p className={styles.hint}>{t('onboarding.changeAnytime')}</p>
          <button className={styles.primaryButton} onClick={() => setStep(2)}>
            {t('onboarding.continue')}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className={styles.step}>
          <h2 className={styles.title}>{t('onboarding.tryFirstCard')}</h2>

          {guidePhase === 'front' && (
            <>
              <p className={styles.coach}>
                {t('onboarding.tapPrompt')}
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
                <span className={styles.demoHint}>{t('review.tapToReveal')}</span>
              </div>
            </>
          )}

          {guidePhase === 'back' && (
            <>
              <p className={styles.coach}>
                {t('onboarding.ratePrompt')}
              </p>
              <div className={styles.demoCardBack}>
                <span className={styles.demoKanjiSmall}>一</span>
                <span className={styles.demoReading}>イチ · ひと.つ</span>
                <span className={styles.demoMeaning}>one</span>
              </div>
              <div className={styles.demoRatings}>
                {([['Again', 'rating.again'], ['Hard', 'rating.hard'], ['Good', 'rating.good'], ['Easy', 'rating.easy']] as const).map(([key, labelKey]) => (
                  <button
                    key={key}
                    className={`${styles.demoRating} ${styles[`demoRating${key}` as keyof typeof styles] ?? ''}`}
                    onClick={() => setGuidePhase('rated')}
                    type="button"
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </div>
            </>
          )}

          {guidePhase === 'rated' && (
            <>
              <div className={styles.celebration}>🎉</div>
              <p className={styles.body}>
                {t('onboarding.greatJob')}
              </p>
              <p className={styles.bodySmall}>
                {t('onboarding.modesAvailable')}
              </p>
              <div className={styles.modes}>
                <span className={styles.modeChip}>📖 {t('mode.flashcards')}</span>
                <span className={styles.modeChip}>意 {t('mode.meaningQuiz')}</span>
                <span className={styles.modeChip}>読 {t('mode.readingQuiz')}</span>
                <span className={styles.modeChip}>書 {t('mode.writingPractice')}</span>
              </div>
              <button className={styles.primaryButton} onClick={handleFinish}>
                {t('onboarding.startLearning')}
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
