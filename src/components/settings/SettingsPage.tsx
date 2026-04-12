import { useState } from 'react'
import { SrsSettings } from './SrsSettings'
import { DataManagement } from './DataManagement'
import { AppearanceSettings } from './AppearanceSettings'
import { useTranslation } from '@/i18n'
import styles from './SettingsPage.module.css'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'srs' | 'appearance' | 'data'>('srs')
  const { t } = useTranslation()

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>{t('settings.title')}</h2>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'srs' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('srs')}
          type="button"
        >
          {t('settings.tabSrs')}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'appearance' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('appearance')}
          type="button"
        >
          {t('settings.tabAppearance')}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'data' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('data')}
          type="button"
        >
          {t('settings.tabData')}
        </button>
      </div>

      {activeTab === 'srs' && <SrsSettings />}
      {activeTab === 'appearance' && <AppearanceSettings />}
      {activeTab === 'data' && <DataManagement />}
    </div>
  )
}
