import type { KanjiEntry } from '@/core/srs/types'
import { useTranslation, getMeanings } from '@/i18n'
import styles from './KanjiDetail.module.css'
import { StrokeOrder } from './StrokeOrder'
import { ComponentGraph } from './ComponentGraph'
import { CardHistoryModal } from './CardHistoryModal'
import { MnemonicEditor } from './MnemonicEditor'
import { SpeakerButton } from '@/components/ui/SpeakerButton'
import { getLookalikes } from '@/data/lookalikes-loader'
import { useKanjiData } from '@/hooks/useKanjiData'
import { useEffect, useMemo, useState } from 'react'
import type { VocabExample } from '@/core/srs/types'
import { getVocabFor } from '@/data/vocab-loader'

interface KanjiDetailProps {
  kanji: KanjiEntry
  onBack: () => void
}

export function KanjiDetail({ kanji, onBack }: KanjiDetailProps) {
  const { t } = useTranslation()
  const { kanji: allKanji } = useKanjiData()
  const [examples, setExamples] = useState<VocabExample[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    let cancelled = false
    getVocabFor(kanji.literal, kanji.grade).then(list => {
      if (!cancelled) setExamples(list)
    })
    return () => { cancelled = true }
  }, [kanji.literal, kanji.grade])

  const lookalikes = useMemo(() => {
    const literals = getLookalikes(kanji.literal, 5)
    if (literals.length === 0 || allKanji.length === 0) return []
    const byLit = new Map(allKanji.map(k => [k.literal, k] as const))
    return literals.map(l => byLit.get(l)).filter((k): k is KanjiEntry => Boolean(k))
  }, [kanji.literal, allKanji])

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={onBack} type="button">
        {t('detail.back')}
      </button>

      <div className={styles.hero}>
        <div className={styles.literal}>{kanji.literal}</div>
        <div className={styles.meanings}>{getMeanings(kanji).join(', ')}</div>
        <button
          type="button"
          className={styles.historyButton}
          onClick={() => setShowHistory(true)}
        >
          ☰ Review history
        </button>
      </div>

      <div className={styles.sections}>
        {/* Readings */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('detail.readings')}</h3>

          {kanji.readings.onYomi.length > 0 && (
            <div className={styles.readingRow}>
              <span className={styles.readingType}>{t('reading.onYomi')}</span>
              <span className={styles.readingValue}>
                {kanji.readings.onYomi.join('、')}
              </span>
              <SpeakerButton text={kanji.readings.onYomi.join('、')} />
            </div>
          )}

          {kanji.readings.kunYomi.length > 0 && (
            <div className={styles.readingRow}>
              <span className={styles.readingType}>{t('reading.kunYomi')}</span>
              <span className={styles.readingValue}>
                {kanji.readings.kunYomi.join('、')}
              </span>
              <SpeakerButton text={kanji.readings.kunYomi.join('、')} />
            </div>
          )}

          {kanji.readings.nanori.length > 0 && (
            <div className={styles.readingRow}>
              <span className={styles.readingType}>{t('reading.nanori')}</span>
              <span className={styles.readingValue}>
                {kanji.readings.nanori.join('、')}
              </span>
            </div>
          )}
        </section>

        {/* Details */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('detail.details')}</h3>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>{t('detail.grade')}</span>
              <span className={styles.detailValue}>
                {kanji.grade === 8 ? t('detail.secondary') : kanji.grade}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>{t('detail.strokes')}</span>
              <span className={styles.detailValue}>{kanji.strokeCount}</span>
            </div>
            {kanji.jlptN !== null && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>{t('detail.jlpt')}</span>
                <span className={styles.detailValue}>N{kanji.jlptN}</span>
              </div>
            )}
            {kanji.frequency !== null && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>{t('detail.frequency')}</span>
                <span className={styles.detailValue}>#{kanji.frequency}</span>
              </div>
            )}
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>{t('detail.radical')}</span>
              <span className={styles.detailValue}>#{kanji.radical}</span>
            </div>
          </div>
        </section>

        {/* Components */}
        {kanji.components.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('detail.components')}</h3>
            <div className={styles.components}>
              {kanji.components.map((comp, i) => (
                <span key={i} className={styles.component}>{comp}</span>
              ))}
            </div>
            <ComponentGraph kanji={kanji} />
          </section>
        )}

        {/* Examples */}
        {examples.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('detail.examples')}</h3>
            <ul className={styles.examplesList}>
              {examples.map(ex => (
                <li key={`${ex.w}-${ex.r}`} className={styles.exampleRow}>
                  <div className={styles.exampleHead}>
                    <span className={styles.exampleWord}>{ex.w}</span>
                    <span className={styles.exampleReading}>{ex.r}</span>
                    {ex.c === 1 && <span className={styles.exampleCommon}>{t('detail.common')}</span>}
                    <SpeakerButton text={ex.w} />
                  </div>
                  <div className={styles.exampleMeaning}>{ex.m}</div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Stroke Order */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('detail.strokeOrder')}</h3>
          <StrokeOrder key={kanji.literal} svgData={kanji.strokeOrderSvg} />
        </section>

        {/* Mnemonic editor (E.5) */}
        <MnemonicEditor literal={kanji.literal} />

        {/* Look-alikes */}
        {lookalikes.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('detail.lookalikes')}</h3>
            <div className={styles.components}>
              {lookalikes.map(la => (
                <span key={la.literal} className={styles.component} title={getMeanings(la).join(', ')}>
                  {la.literal}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>

      {showHistory && (
        <CardHistoryModal literal={kanji.literal} onClose={() => setShowHistory(false)} />
      )}
    </div>
  )
}
