import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./db', () => ({
  getAllCardStates: vi.fn(),
  getAllDailyStats: vi.fn(),
  putCardState: vi.fn(),
  putDailyStats: vi.fn(),
}))

vi.mock('./settings', () => ({
  loadSettings: vi.fn(),
  saveSettings: vi.fn(),
}))

import { exportData, importData } from './export'
import { getAllCardStates, getAllDailyStats } from './db'
import { loadSettings } from './settings'

const mockedGetCards = vi.mocked(getAllCardStates)
const mockedGetStats = vi.mocked(getAllDailyStats)
const mockedLoadSettings = vi.mocked(loadSettings)

describe('export/import', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exportData', () => {
    it('exports cards, stats, and settings as JSON', async () => {
      mockedGetCards.mockResolvedValue([])
      mockedGetStats.mockResolvedValue([])
      mockedLoadSettings.mockReturnValue({
        dailyNewCards: 10,
        dailyReviewLimit: 0,
        requestRetention: 0.9,
        maximumInterval: 365,
        defaultQuizMode: 'recognition',
        showReadingsOnFront: false,
      })

      const json = await exportData()
      const parsed = JSON.parse(json)

      expect(parsed.version).toBe(1)
      expect(parsed.exportedAt).toBeDefined()
      expect(Array.isArray(parsed.cards)).toBe(true)
      expect(Array.isArray(parsed.dailyStats)).toBe(true)
      expect(parsed.settings).toBeDefined()
    })
  })

  describe('importData', () => {
    it('rejects invalid JSON', async () => {
      await expect(importData('not json')).rejects.toThrow('Invalid JSON')
    })

    it('rejects data without version', async () => {
      await expect(importData('{}')).rejects.toThrow('Invalid export data')
    })

    it('rejects data with wrong version', async () => {
      const data = JSON.stringify({ version: 99, cards: [], dailyStats: [], settings: {} })
      await expect(importData(data)).rejects.toThrow('Invalid export data')
    })

    it('accepts valid export format', async () => {
      const data = JSON.stringify({
        version: 1,
        exportedAt: new Date().toISOString(),
        cards: [
          {
            kanjiLiteral: '日',
            introduced: true,
            fsrsCard: { due: new Date().toISOString() },
            lastReviewedAt: null,
            totalReviews: 0,
            correctReviews: 0,
            introducedAt: null,
          },
        ],
        dailyStats: [
          { date: '2026-01-01', newCardsIntroduced: 5, reviewsCompleted: 10, correctCount: 8, totalTimeMs: 30000 },
        ],
        settings: { dailyNewCards: 15 },
      })

      const result = await importData(data)
      expect(result.cardsImported).toBe(1)
      expect(result.statsImported).toBe(1)
    })
  })
})
