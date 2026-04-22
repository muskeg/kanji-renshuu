import { useEffect, useState } from 'react'
import { useTranslation } from '@/i18n'
import { LEVEL_UP_EVENT, getRankKey } from '@/core/gamification/xp'
import type { LevelUpEventDetail, RankKey } from '@/core/gamification/xp'
import styles from './LevelUpModal.module.css'

/**
 * Listens for `LEVEL_UP_EVENT` and shows a celebratory modal exactly once
 * per crossing. Dismissable by click or Escape.
 */
export function LevelUpModal() {
  const { t } = useTranslation()
  const [pending, setPending] = useState<LevelUpEventDetail | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<LevelUpEventDetail>).detail
      setPending(detail)
    }
    window.addEventListener(LEVEL_UP_EVENT, handler)
    return () => window.removeEventListener(LEVEL_UP_EVENT, handler)
  }, [])

  useEffect(() => {
    if (!pending) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPending(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pending])

  if (!pending) return null

  const previousRank: RankKey = getRankKey(pending.previousLevel)
  const newRank: RankKey = getRankKey(pending.newLevel)
  const rankChanged = previousRank !== newRank

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="levelup-title"
      onClick={() => setPending(null)}
    >
      <div className={styles.card} onClick={e => e.stopPropagation()}>
        <div className={styles.confetti} aria-hidden>
          ✨
        </div>
        <h2 id="levelup-title" className={styles.title}>
          {t('levelUp.title')}
        </h2>
        <p className={styles.subtitle}>
          {t('levelUp.subtitle', { level: pending.newLevel })}
        </p>
        {rankChanged && (
          <p className={styles.rank}>
            {t('levelUp.newRank', { rank: t(newRank) })}
          </p>
        )}
        <button
          type="button"
          className={styles.continue}
          onClick={() => setPending(null)}
          autoFocus
        >
          {t('levelUp.continue')}
        </button>
      </div>
    </div>
  )
}
