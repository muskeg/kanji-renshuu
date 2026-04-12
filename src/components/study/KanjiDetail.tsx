import type { KanjiEntry } from '@/core/srs/types'
import { useTranslation } from '@/i18n'
import styles from './KanjiDetail.module.css'
import { StrokeOrder } from './StrokeOrder'

interface KanjiDetailProps {
  kanji: KanjiEntry
  onBack: () => void
}

export function KanjiDetail({ kanji, onBack }: KanjiDetailProps) {
  const { t } = useTranslation()

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={onBack} type="button">
        {t('detail.back')}
      </button>

      <div className={styles.hero}>
        <div className={styles.literal}>{kanji.literal}</div>
        <div className={styles.meanings}>{kanji.meanings.join(', ')}</div>
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
            </div>
          )}

          {kanji.readings.kunYomi.length > 0 && (
            <div className={styles.readingRow}>
              <span className={styles.readingType}>{t('reading.kunYomi')}</span>
              <span className={styles.readingValue}>
                {kanji.readings.kunYomi.join('、')}
              </span>
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
            {kanji.jlpt !== null && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>{t('detail.jlpt')}</span>
                <span className={styles.detailValue}>N{kanji.jlpt}</span>
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
          </section>
        )}

        {/* Stroke Order */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('detail.strokeOrder')}</h3>
          <StrokeOrder key={kanji.literal} svgData={kanji.strokeOrderSvg} />
        </section>
      </div>
    </div>
  )
}
