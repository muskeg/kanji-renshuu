import type { CardState, DailyStats, AppSettings } from '@/core/srs/types'
import { getAllCardStates, getAllDailyStats, putCardState, putDailyStats } from './db'
import { loadSettings, saveSettings } from './settings'

interface ExportData {
  version: 1
  exportedAt: string
  cards: CardState[]
  dailyStats: DailyStats[]
  settings: AppSettings
}

export async function exportData(): Promise<string> {
  const [cards, dailyStats] = await Promise.all([
    getAllCardStates(),
    getAllDailyStats(),
  ])
  const settings = loadSettings()

  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    cards,
    dailyStats,
    settings,
  }

  return JSON.stringify(data, null, 2)
}

function validateExportData(data: unknown): data is ExportData {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  if (d.version !== 1) return false
  if (!Array.isArray(d.cards)) return false
  if (!Array.isArray(d.dailyStats)) return false
  if (typeof d.settings !== 'object' || d.settings === null) return false
  // Validate cards have required fields
  for (const card of d.cards as unknown[]) {
    if (typeof card !== 'object' || card === null) return false
    const c = card as Record<string, unknown>
    if (typeof c.kanjiLiteral !== 'string') return false
    if (typeof c.introduced !== 'boolean') return false
  }
  return true
}

export async function importData(jsonString: string): Promise<{ cardsImported: number; statsImported: number }> {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    throw new Error('Invalid JSON format')
  }

  if (!validateExportData(parsed)) {
    throw new Error('Invalid export data format')
  }

  // Import cards
  for (const card of parsed.cards) {
    // Reconstruct Date objects for FSRS card
    if (card.fsrsCard) {
      card.fsrsCard.due = new Date(card.fsrsCard.due as unknown as string)
      if (card.fsrsCard.last_review) {
        card.fsrsCard.last_review = new Date(card.fsrsCard.last_review as unknown as string)
      }
    }
    await putCardState(card)
  }

  // Import daily stats
  for (const stat of parsed.dailyStats) {
    await putDailyStats(stat)
  }

  // Import settings
  saveSettings(parsed.settings)

  return {
    cardsImported: parsed.cards.length,
    statsImported: parsed.dailyStats.length,
  }
}

export function downloadJson(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
