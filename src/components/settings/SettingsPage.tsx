import { useState } from 'react'
import { SrsSettings } from './SrsSettings'
import { DataManagement } from './DataManagement'
import styles from './SettingsPage.module.css'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'srs' | 'data'>('srs')

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Settings</h2>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'srs' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('srs')}
          type="button"
        >
          SRS & Study
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'data' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('data')}
          type="button"
        >
          Data
        </button>
      </div>

      {activeTab === 'srs' && <SrsSettings />}
      {activeTab === 'data' && <DataManagement />}
    </div>
  )
}
