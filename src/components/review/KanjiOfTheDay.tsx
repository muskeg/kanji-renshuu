import { useMemo } from 'react'
import type { KanjiEntry } from '@/core/srs/types'
import { useTranslation, getMeanings } from '@/i18n'
import styles from './KanjiOfTheDay.module.css'

interface KanjiOfTheDayProps {
  kanjiData: KanjiEntry[]
}

function pickDaily(kanjiData: KanjiEntry[]): KanjiEntry | null {
  if (kanjiData.length === 0) return null
  const today = new Date()
  const dayIndex = today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()
  return kanjiData[dayIndex % kanjiData.length]!
}

export function KanjiOfTheDay({ kanjiData }: KanjiOfTheDayProps) {
  const kanji = useMemo(() => pickDaily(kanjiData), [kanjiData])
  const { t } = useTranslation()

  if (!kanji) return null

  const readings = [
    ...kanji.readings.onYomi,
    ...kanji.readings.kunYomi.slice(0, 2),
  ].join(' · ')

  return (
    <div className={styles.container}>
      <span className={styles.heading}>{t('kanjiOfDay.heading')}</span>
      <span className={styles.kanji}>{kanji.literal}</span>
      <span className={styles.readings}>{readings}</span>
      <span className={styles.meaning}>{getMeanings(kanji).slice(0, 3).join(', ')}</span>
      <div className={styles.meta}>
        <span className={styles.tag}>{kanji.grade === 8 ? t('kanjiOfDay.gradeS') : t('kanjiOfDay.grade', { grade: kanji.grade })}</span>
        <span className={styles.tag}>{t('kanjiOfDay.strokes', { count: kanji.strokeCount })}</span>
        {kanji.jlpt && <span className={styles.tag}>N{kanji.jlpt}</span>}
      </div>
    </div>
  )
}
