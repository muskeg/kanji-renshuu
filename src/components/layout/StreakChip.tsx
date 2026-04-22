import { useTranslation } from '@/i18n'
import styles from './StreakChip.module.css'

export interface StreakChipProps {
  streak: number
  freezes: number
  activatedToday: boolean
}

interface Tier {
  min: number
  icon: string
  shape: string
  labelKey: 'streak.tier.starting' | 'streak.tier.warm' | 'streak.tier.hot' | 'streak.tier.legendary' | 'streak.tier.diamond'
}

// Color-blind safety: each tier changes both color *and* glyph/shape.
const TIERS: Tier[] = [
  { min: 0, icon: '·', shape: 'starting', labelKey: 'streak.tier.starting' },
  { min: 3, icon: '🔥', shape: 'warm', labelKey: 'streak.tier.warm' },
  { min: 30, icon: '💧', shape: 'hot', labelKey: 'streak.tier.hot' },
  { min: 100, icon: '🌈', shape: 'legendary', labelKey: 'streak.tier.legendary' },
  { min: 365, icon: '💎', shape: 'diamond', labelKey: 'streak.tier.diamond' },
]

function tierFor(streak: number): Tier {
  let tier = TIERS[0]!
  for (const t of TIERS) {
    if (streak >= t.min) tier = t
  }
  return tier
}

/**
 * Streak indicator with tiered icons. Used in the StatusBar.
 * Hides freezes when none are available.
 */
export function StreakChip({ streak, freezes, activatedToday }: StreakChipProps) {
  const { t } = useTranslation()
  const tier = tierFor(streak)
  const tierClass = styles[tier.shape] ?? ''
  const dim = !activatedToday && streak === 0

  return (
    <span
      className={`${styles.chip} ${tierClass} ${dim ? styles.dim : ''}`}
      title={t('streak.label', { days: streak })}
    >
      <span className={styles.icon} aria-hidden>
        {tier.icon}
      </span>
      <span className={styles.value}>{streak}d</span>
      {freezes > 0 && (
        <span
          className={styles.freezes}
          title={
            freezes === 1
              ? t('streak.freezes', { count: freezes })
              : t('streak.freezes_plural', { count: freezes })
          }
        >
          ❄ {freezes}
        </span>
      )}
    </span>
  )
}
