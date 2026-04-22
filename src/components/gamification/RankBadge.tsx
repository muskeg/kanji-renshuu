import { useTranslation } from '@/i18n'
import { useUserStats } from '@/hooks/useUserStats'
import { getLevel, getRankKey } from '@/core/gamification/xp'
import type { RankKey } from '@/core/gamification/xp'
import styles from './RankBadge.module.css'

/**
 * Compact level + rank chip for the header. Hidden until the user has at
 * least 1 XP so first-time users aren't confronted with empty stats.
 */
export function RankBadge() {
  const { t } = useTranslation()
  const { stats } = useUserStats()

  if (!stats || stats.lifetimeXp <= 0) return null

  const level = getLevel(stats.lifetimeXp)
  const rankKey: RankKey = getRankKey(level)

  return (
    <span
      className={styles.badge}
      title={t('xp.lifetime', { xp: stats.lifetimeXp })}
      aria-label={`${t('xp.level', { level })} – ${t(rankKey)}`}
    >
      <span className={styles.level}>L{level}</span>
      <span className={styles.rank}>{t(rankKey)}</span>
    </span>
  )
}
