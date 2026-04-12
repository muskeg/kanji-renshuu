import { useState, useRef } from 'react'
import { exportData, importData, downloadJson } from '@/core/storage/export'
import { useTranslation } from '@/i18n'
import styles from './DataManagement.module.css'

export function DataManagement() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    try {
      const json = await exportData()
      const date = new Date().toISOString().split('T')[0]
      downloadJson(json, `kanji-renshuu-backup-${date}.json`)
      setStatus(t('data.exportSuccess'))
      setIsError(false)
    } catch {
      setStatus(t('data.exportFailed'))
      setIsError(true)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const result = await importData(text)
      setStatus(t('data.importSuccess', { cards: result.cardsImported, stats: result.statsImported }))
      setIsError(false)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : t('data.importFailed'))
      setIsError(true)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleReset = async () => {
    if (!confirm(t('data.resetConfirm'))) return

    try {
      // Clear IndexedDB
      const dbs = await indexedDB.databases()
      for (const db of dbs) {
        if (db.name) indexedDB.deleteDatabase(db.name)
      }
      // Clear localStorage
      localStorage.clear()
      setStatus(t('data.resetSuccess'))
      setIsError(false)
    } catch {
      setStatus(t('data.resetFailed'))
      setIsError(true)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('data.exportTitle')}</h3>
        <p className={styles.description}>{t('data.exportDesc')}</p>
        <button className={styles.button} onClick={handleExport} type="button">
          {t('data.exportButton')}
        </button>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('data.importTitle')}</h3>
        <p className={styles.description}>{t('data.importDesc')}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className={styles.fileInput}
          id="import-file"
        />
        <label htmlFor="import-file" className={styles.button}>
          {t('data.chooseFile')}
        </label>
      </div>

      <div className={styles.section}>
        <h3 className={`${styles.sectionTitle} ${styles.danger}`}>{t('data.resetTitle')}</h3>
        <p className={styles.description}>{t('data.resetDesc')}</p>
        <button className={styles.dangerButton} onClick={handleReset} type="button">
          {t('data.resetButton')}
        </button>
      </div>

      {status && (
        <div className={`${styles.status} ${isError ? styles.statusError : styles.statusSuccess}`}>
          {status}
        </div>
      )}
    </div>
  )
}
