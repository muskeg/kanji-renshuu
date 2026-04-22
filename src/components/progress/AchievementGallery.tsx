import { useState, useMemo } from 'react'
import type { KanjiEntry } from '@/core/srs/types'
import type { EvaluatedAchievement, AchievementFamily } from '@/core/gamification/achievements'
import { FAMILY_ORDER } from '@/core/gamification/achievements'
import { useAchievements } from '@/hooks/useAchievements'
import { useTranslation } from '@/i18n'
import styles from './AchievementGallery.module.css'

interface AchievementGalleryProps {
  kanjiData: KanjiEntry[]
}

export function AchievementGallery({ kanjiData }: AchievementGalleryProps) {
  const { achievements, loading } = useAchievements(kanjiData)
  const [selected, setSelected] = useState<EvaluatedAchievement | null>(null)
  const { t } = useTranslation()

  const grouped = useMemo(() => {
    const map = new Map<AchievementFamily, EvaluatedAchievement[]>()
    for (const fam of FAMILY_ORDER) map.set(fam, [])
    for (const a of achievements) map.get(a.family)?.push(a)
    return map
  }, [achievements])

  if (loading) return null

  const totalUnlocked = achievements.filter(a => a.unlocked).length

  return (
    <div className={styles.container}>
      <div className={styles.summary}>
        {t('achievements.earned', { count: totalUnlocked })}
        {' / '}
        {achievements.length}
      </div>

      {FAMILY_ORDER.map(family => {
        const items = grouped.get(family) ?? []
        if (items.length === 0) return null
        const earnedInFam = items.filter(a => a.unlocked).length
        return (
          <section key={family} className={styles.group}>
            <header className={styles.groupHeader}>
              <span className={styles.groupLabel}>{t(`family.${family}` as 'family.milestones')}</span>
              <span className={styles.groupCount}>{earnedInFam}/{items.length}</span>
            </header>
            <div className={styles.grid}>
              {items.map(a => (
                <button
                  key={a.id}
                  className={`${styles.card} ${a.unlocked ? '' : styles.locked}`}
                  onClick={() => setSelected(selected?.id === a.id ? null : a)}
                  aria-expanded={selected?.id === a.id}
                  aria-pressed={selected?.id === a.id}
                >
                  <span className={styles.icon}>{a.unlocked ? a.icon : '🔒'}</span>
                  <span className={styles.title}>{t(a.titleKey as 'achievement.kanji10.title')}</span>
                  {!a.unlocked && (
                    <div className={styles.progressWrap}>
                      <div className={styles.progressTrack}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${Math.round(a.progress * 100)}%` }}
                        />
                      </div>
                      <span className={styles.progressText}>{Math.round(a.progress * 100)}%</span>
                    </div>
                  )}
                  {a.unlocked && a.unlockedAt && (
                    <span className={styles.date}>{a.unlockedAt}</span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )
      })}

      {selected && (
        <div className={styles.detail}>
          <span className={styles.detailIcon}>{selected.unlocked ? selected.icon : '🔒'}</span>
          <span className={styles.detailTitle}>{t(selected.titleKey as 'achievement.kanji10.title')}</span>
          <span className={styles.detailDesc}>{t(selected.descriptionKey as 'achievement.kanji10.desc')}</span>
          {selected.unlocked && selected.unlockedAt && (
            <span className={styles.detailDate}>{t('achievements.earnedDate', { date: selected.unlockedAt })}</span>
          )}
          {!selected.unlocked && (
            <span className={styles.detailProgress}>{Math.round(selected.progress * 100)}%</span>
          )}
        </div>
      )}
    </div>
  )
}
