import { useState, useMemo, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { ReviewSession } from '@/components/review/ReviewSession'
import { MeaningQuizSession } from '@/components/study/MeaningQuizSession'
import { ReadingQuizSession } from '@/components/study/ReadingQuizSession'
import { WritingPracticeSession } from '@/components/study/WritingPracticeSession'
import { KanjiDetail } from '@/components/study/KanjiDetail'
import { KanjiGrid } from '@/components/browse/KanjiGrid'
import { FilterBar, type KanjiFilter } from '@/components/browse/FilterBar'
import { SearchBar } from '@/components/browse/SearchBar'
import { Dashboard } from '@/components/progress/Dashboard'
import { SettingsPage } from '@/components/settings/SettingsPage'
import { useKanjiData } from '@/hooks/useKanjiData'
import { useCardStatus } from '@/hooks/useCardStatus'
import type { KanjiEntry } from '@/core/srs/types'
import { katakanaToHiragana, normalizeReading } from '@/utils/japanese'

export type AppView = 'review' | 'browse' | 'meaning-quiz' | 'reading-quiz' | 'writing' | 'detail' | 'progress' | 'settings'

export function App() {
  const [currentView, setCurrentView] = useState<AppView>('review')
  const [selectedKanji, setSelectedKanji] = useState<KanjiEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<KanjiFilter>({ grades: [], jlptLevels: [], status: [] })
  const { kanji, loading, error } = useKanjiData()
  const cardStatusMap = useCardStatus()

  const handleSelectKanji = useCallback((k: KanjiEntry) => {
    setSelectedKanji(k)
    setCurrentView('detail')
  }, [])

  const handleBack = useCallback(() => {
    setCurrentView('browse')
    setSelectedKanji(null)
  }, [])

  const filteredKanji = useMemo(() => {
    let result = kanji

    if (filter.grades.length > 0) {
      result = result.filter(k => filter.grades.includes(k.grade))
    }

    if (filter.jlptLevels.length > 0) {
      result = result.filter(k => k.jlpt !== null && filter.jlptLevels.includes(k.jlpt))
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      const qHiragana = katakanaToHiragana(q)
      result = result.filter(k =>
        k.literal === q ||
        k.meanings.some(m => m.toLowerCase().includes(q)) ||
        k.readings.onYomi.some(r => katakanaToHiragana(r).includes(qHiragana)) ||
        k.readings.kunYomi.some(r => normalizeReading(r).includes(qHiragana)) ||
        k.components.some(c => c.includes(q))
      )
    }

    return result
  }, [kanji, filter, searchQuery])

  return (
    <>
      <Header currentView={currentView} onNavigate={(v) => setCurrentView(v as AppView)} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--spacing-lg)' }}>
        {error && (
          <div role="alert" style={{ color: 'var(--color-error)', padding: 'var(--spacing-lg)' }}>
            Error: {error}
          </div>
        )}

        {loading && !error && (
          <div style={{ padding: 'var(--spacing-2xl)', color: 'var(--color-text-secondary)' }}>
            Loading kanji data...
          </div>
        )}

        {!loading && !error && currentView === 'review' && (
          <ReviewSession kanjiData={kanji} />
        )}

        {!loading && !error && currentView === 'meaning-quiz' && (
          <MeaningQuizSession kanjiData={kanji} />
        )}

        {!loading && !error && currentView === 'reading-quiz' && (
          <ReadingQuizSession kanjiData={kanji} />
        )}

        {!loading && !error && currentView === 'writing' && (
          <WritingPracticeSession kanjiData={kanji} />
        )}

        {!loading && !error && currentView === 'browse' && (
          <div style={{ width: '100%', maxWidth: '960px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', alignItems: 'center' }}>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <FilterBar filter={filter} onChange={setFilter} />
            <KanjiGrid kanji={filteredKanji} onSelect={handleSelectKanji} statusMap={cardStatusMap} />
          </div>
        )}

        {!loading && !error && currentView === 'detail' && selectedKanji && (
          <KanjiDetail kanji={selectedKanji} onBack={handleBack} />
        )}

        {!loading && !error && currentView === 'progress' && (
          <Dashboard kanjiData={kanji} />
        )}

        {!loading && !error && currentView === 'settings' && (
          <SettingsPage />
        )}
      </main>
    </>
  )
}
