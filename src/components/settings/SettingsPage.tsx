import { useState } from 'react'
import { SrsSettings } from './SrsSettings'
import { DataManagement } from './DataManagement'
import { AppearanceSettings } from './AppearanceSettings'
import styles from './SettingsPage.module.css'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'srs' | 'appearance' | 'data'>('srs')

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
          className={`${styles.tab} ${activeTab === 'appearance' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('appearance')}
          type="button"
        >
          Appearance
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
      {activeTab === 'appearance' && <AppearanceSettings />}
      {activeTab === 'data' && <DataManagement />}
    </div>
  )
}
