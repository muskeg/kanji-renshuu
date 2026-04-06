import { openDB, type IDBPDatabase } from 'idb'
import type { CardState, ReviewLogEntry, DailyStats } from '../srs/types'

const DB_NAME = 'kanji-renshuu'
const DB_VERSION = 1

interface KanjiRenshuuDB {
  cards: {
    key: string
    value: CardState
    indexes: { 'by-introduced': number }
  }
  reviewLogs: {
    key: string
    value: ReviewLogEntry
    indexes: {
      'by-kanji': string
      'by-timestamp': number
      'by-date': string
    }
  }
  dailyStats: {
    key: string
    value: DailyStats
  }
}

let dbPromise: Promise<IDBPDatabase<KanjiRenshuuDB>> | null = null

function getDB(): Promise<IDBPDatabase<KanjiRenshuuDB>> {
  if (!dbPromise) {
    dbPromise = openDB<KanjiRenshuuDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Cards store
        const cardStore = db.createObjectStore('cards', { keyPath: 'kanjiLiteral' })
        cardStore.createIndex('by-introduced', 'introduced')

        // Review logs store
        const logStore = db.createObjectStore('reviewLogs', { keyPath: 'id' })
        logStore.createIndex('by-kanji', 'kanjiLiteral')
        logStore.createIndex('by-timestamp', 'timestamp')

        // Daily stats store
        db.createObjectStore('dailyStats', { keyPath: 'date' })
      },
    })
  }
  return dbPromise
}

// --- Cards ---

export async function getCardState(kanjiLiteral: string): Promise<CardState | undefined> {
  const db = await getDB()
  return db.get('cards', kanjiLiteral)
}

export async function putCardState(cardState: CardState): Promise<void> {
  const db = await getDB()
  await db.put('cards', cardState)
}

export async function getAllCardStates(): Promise<CardState[]> {
  const db = await getDB()
  return db.getAll('cards')
}

export async function getIntroducedCards(): Promise<CardState[]> {
  const db = await getDB()
  const tx = db.transaction('cards', 'readonly')
  const index = tx.store.index('by-introduced')
  // introduced = true maps to 1 in IDB boolean indexing
  const cards: CardState[] = []
  let cursor = await index.openCursor()
  while (cursor) {
    if (cursor.value.introduced) {
      cards.push(cursor.value)
    }
    cursor = await cursor.continue()
  }
  return cards
}

export async function getCardCount(): Promise<number> {
  const db = await getDB()
  return db.count('cards')
}

// --- Review Logs ---

export async function addReviewLog(log: ReviewLogEntry): Promise<void> {
  const db = await getDB()
  await db.add('reviewLogs', log)
}

export async function getReviewLogsByDate(date: string): Promise<ReviewLogEntry[]> {
  const db = await getDB()
  const all = await db.getAll('reviewLogs')
  return all.filter(log => {
    const logDate = new Date(log.timestamp).toISOString().split('T')[0]
    return logDate === date
  })
}

// --- Daily Stats ---

export async function getDailyStats(date: string): Promise<DailyStats | undefined> {
  const db = await getDB()
  return db.get('dailyStats', date)
}

export async function putDailyStats(stats: DailyStats): Promise<void> {
  const db = await getDB()
  await db.put('dailyStats', stats)
}

export async function getAllDailyStats(): Promise<DailyStats[]> {
  const db = await getDB()
  return db.getAll('dailyStats')
}

// --- Utility ---

export function todayDateString(): string {
  return new Date().toISOString().split('T')[0]!
}

export function generateId(): string {
  return crypto.randomUUID()
}
