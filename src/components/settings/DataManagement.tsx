import { useState, useRef } from 'react'
import { exportData, importData, downloadJson } from '@/core/storage/export'
import styles from './DataManagement.module.css'

export function DataManagement() {
  const [status, setStatus] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    try {
      const json = await exportData()
      const date = new Date().toISOString().split('T')[0]
      downloadJson(json, `kanji-renshuu-backup-${date}.json`)
      setStatus('Export downloaded successfully')
      setIsError(false)
    } catch {
      setStatus('Export failed')
      setIsError(true)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const result = await importData(text)
      setStatus(`Imported ${result.cardsImported} cards and ${result.statsImported} daily stats`)
      setIsError(false)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Import failed')
      setIsError(true)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleReset = async () => {
    if (!confirm('This will delete all your progress. Are you sure?')) return

    try {
      // Clear IndexedDB
      const dbs = await indexedDB.databases()
      for (const db of dbs) {
        if (db.name) indexedDB.deleteDatabase(db.name)
      }
      // Clear localStorage
      localStorage.clear()
      setStatus('All data cleared. Reload the page to start fresh.')
      setIsError(false)
    } catch {
      setStatus('Reset failed')
      setIsError(true)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Export</h3>
        <p className={styles.description}>Download a JSON backup of all your progress, card states, and settings.</p>
        <button className={styles.button} onClick={handleExport} type="button">
          Export Data
        </button>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Import</h3>
        <p className={styles.description}>Restore from a previously exported JSON backup. This will merge with existing data.</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className={styles.fileInput}
          id="import-file"
        />
        <label htmlFor="import-file" className={styles.button}>
          Choose File
        </label>
      </div>

      <div className={styles.section}>
        <h3 className={`${styles.sectionTitle} ${styles.danger}`}>Reset</h3>
        <p className={styles.description}>Delete all progress data and settings. This cannot be undone.</p>
        <button className={styles.dangerButton} onClick={handleReset} type="button">
          Reset All Data
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
