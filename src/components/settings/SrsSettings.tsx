import { useState } from 'react'
import type { AppSettings, QuizMode, LearningPath } from '@/core/srs/types'
import { DEFAULT_SETTINGS } from '@/core/srs/types'
import { loadSettings, saveSettings } from '@/core/storage/settings'
import { updateSchedulerSettings } from '@/core/srs/scheduler'
import { useTranslation } from '@/i18n'
import styles from './SrsSettings.module.css'

export function SrsSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)
  const [saved, setSaved] = useState(false)
  const { t } = useTranslation()

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = () => {
    saveSettings(settings)
    updateSchedulerSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setSettings({ ...DEFAULT_SETTINGS })
    setSaved(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.group}>
        <label className={styles.label}>
          {t('srs.dailyNewCards')}
          <span className={styles.hint}>{t('srs.dailyNewCardsHint')}</span>
        </label>
        <input
          type="number"
          className={styles.input}
          value={settings.dailyNewCards}
          onChange={e => handleChange('dailyNewCards', Math.max(0, Math.min(50, Number(e.target.value) || 0)))}
          min={0}
          max={50}
        />
      </div>

      <div className={styles.group}>
        <label className={styles.label}>
          {t('srs.dailyReviewLimit')}
          <span className={styles.hint}>{t('srs.dailyReviewLimitHint')}</span>
        </label>
        <input
          type="number"
          className={styles.input}
          value={settings.dailyReviewLimit}
          onChange={e => handleChange('dailyReviewLimit', Math.max(0, Number(e.target.value) || 0))}
          min={0}
        />
      </div>

      <div className={styles.group}>
        <label className={styles.label}>
          {t('srs.targetRetention')}
          <span className={styles.hint}>{t('srs.targetRetentionHint')}</span>
        </label>
        <input
          type="number"
          className={styles.input}
          value={settings.requestRetention}
          onChange={e => handleChange('requestRetention', Math.max(0.7, Math.min(0.99, Number(e.target.value) || 0.9)))}
          min={0.7}
          max={0.99}
          step={0.01}
        />
      </div>

      <div className={styles.group}>
        <label className={styles.label}>
          {t('srs.maxInterval')}
          <span className={styles.hint}>{t('srs.maxIntervalHint')}</span>
        </label>
        <input
          type="number"
          className={styles.input}
          value={settings.maximumInterval}
          onChange={e => handleChange('maximumInterval', Math.max(1, Math.min(3650, Number(e.target.value) || 365)))}
          min={1}
          max={3650}
        />
      </div>

      <div className={styles.group}>
        <label className={styles.label}>
          {t('srs.defaultQuizMode')}
          <span className={styles.hint}>{t('srs.defaultQuizModeHint')}</span>
        </label>
        <select
          className={styles.select}
          value={settings.defaultQuizMode}
          onChange={e => handleChange('defaultQuizMode', e.target.value as QuizMode)}
        >
          <option value="recognition">{t('mode.flashcards')}</option>
          <option value="meaning">{t('mode.meaningQuiz')}</option>
          <option value="reading">{t('mode.readingQuiz')}</option>
          <option value="writing">{t('mode.writingPractice')}</option>
        </select>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>
          {t('srs.guidedWriting')}
          <span className={styles.hint}>{t('srs.guidedWritingHint')}</span>
        </label>
        <select
          className={styles.select}
          value={settings.guidedWriting ? 'on' : 'off'}
          onChange={e => handleChange('guidedWriting', e.target.value === 'on')}
        >
          <option value="on">{t('appearance.on')}</option>
          <option value="off">{t('appearance.off')}</option>
        </select>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>
          Learning path
          <span className={styles.hint}>Order in which new kanji are introduced.</span>
        </label>
        <select
          className={styles.select}
          value={settings.learningPath}
          onChange={e => handleChange('learningPath', e.target.value as LearningPath)}
        >
          <option value="byGrade">By school grade (default)</option>
          <option value="byJlpt">By JLPT level (N5 → N1)</option>
          <option value="byFrequency">By frequency (most common first)</option>
          <option value="radicalFirst">Radicals first</option>
          <option value="byStrokeCount">By stroke count (fewest first)</option>
        </select>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>
          Pause SRS
          <span className={styles.hint}>Stop introducing new cards. Existing reviews still surface.</span>
        </label>
        <select
          className={styles.select}
          value={settings.pauseSrs ? 'on' : 'off'}
          onChange={e => handleChange('pauseSrs', e.target.value === 'on')}
        >
          <option value="off">Off</option>
          <option value="on">On (paused)</option>
        </select>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>
          Per-grade daily caps
          <span className={styles.hint}>
            Optional caps on how many new kanji from each grade can be introduced per day.
            Leave blank for no cap on that grade.
          </span>
        </label>
        <div className={styles.gradeCapGrid}>
          {[1, 2, 3, 4, 5, 6, 8].map(grade => {
            const value = settings.perGradeNewCaps?.[grade]
            return (
              <div key={grade} className={styles.gradeCapItem}>
                <span className={styles.gradeCapLabel}>Grade {grade}</span>
                <input
                  type="number"
                  className={styles.gradeCapInput}
                  min={0}
                  max={50}
                  placeholder="∞"
                  value={value === undefined ? '' : value}
                  onChange={e => {
                    const raw = e.target.value
                    const next = { ...(settings.perGradeNewCaps ?? {}) }
                    if (raw === '') {
                      delete next[grade]
                    } else {
                      next[grade] = Math.max(0, Math.min(50, Number(raw) || 0))
                    }
                    handleChange('perGradeNewCaps', next)
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.saveButton} onClick={handleSave} type="button">
          {saved ? t('srs.saved') : t('srs.save')}
        </button>
        <button className={styles.resetButton} onClick={handleReset} type="button">
          {t('srs.reset')}
        </button>
      </div>
    </div>
  )
}
