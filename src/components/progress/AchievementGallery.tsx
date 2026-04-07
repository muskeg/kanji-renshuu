import { useState } from 'react'
import type { KanjiEntry } from '@/core/srs/types'
import type { AchievementStatus } from '@/core/srs/milestones'
import { useAchievements } from '@/hooks/useAchievements'
import styles from './AchievementGallery.module.css'

interface AchievementGalleryProps {
  kanjiData: KanjiEntry[]
}

export function AchievementGallery({ kanjiData }: AchievementGalleryProps) {
  const { achievements, loading } = useAchievements(kanjiData)
  const [selected, setSelected] = useState<AchievementStatus | null>(null)

  if (loading) return null

  const earned = achievements.filter(a => a.earned)
  const locked = achievements.filter(a => !a.earned)

  return (
    <div className={styles.container}>
      {earned.length > 0 && (
        <div className={styles.group}>
          <span className={styles.groupLabel}>Earned — {earned.length}</span>
          <div className={styles.grid}>
            {earned.map(a => (
              <button
                key={a.id}
                className={styles.card}
                onClick={() => setSelected(selected?.id === a.id ? null : a)}
                aria-expanded={selected?.id === a.id}
              >
                <span className={styles.icon}>{a.icon}</span>
                <span className={styles.title}>{a.title}</span>
                {a.dateEarned && (
                  <span className={styles.date}>{a.dateEarned}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div className={styles.group}>
          <span className={styles.groupLabel}>Locked — {locked.length}</span>
          <div className={styles.grid}>
            {locked.map(a => (
              <button
                key={a.id}
                className={`${styles.card} ${styles.locked}`}
                onClick={() => setSelected(selected?.id === a.id ? null : a)}
                aria-expanded={selected?.id === a.id}
              >
                <span className={styles.icon}>🔒</span>
                <span className={styles.title}>{a.title}</span>
                {a.target > 0 && (
                  <div className={styles.progressWrap}>
                    <div className={styles.progressTrack}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${Math.round((a.progress / a.target) * 100)}%` }}
                      />
                    </div>
                    <span className={styles.progressText}>
                      {a.progress}/{a.target}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className={styles.detail}>
          <span className={styles.detailIcon}>{selected.earned ? selected.icon : '🔒'}</span>
          <span className={styles.detailTitle}>{selected.title}</span>
          <span className={styles.detailDesc}>{selected.description}</span>
          {selected.earned && selected.dateEarned && (
            <span className={styles.detailDate}>Earned {selected.dateEarned}</span>
          )}
          {!selected.earned && selected.target > 0 && (
            <span className={styles.detailProgress}>
              {selected.progress} / {selected.target}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
