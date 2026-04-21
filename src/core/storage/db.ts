import { openDB, type IDBPDatabase } from 'idb'
import type { CardState, ReviewLogEntry, DailyStats } from '@/core/srs/types'
import {
  type KanjiRenshuuDB,
  LATEST_DB_VERSION,
  isoDateFromTimestamp,
  runMigrations,
} from './migrations'

const DB_NAME = 'kanji-renshuu'

let dbPromise: Promise<IDBPDatabase<KanjiRenshuuDB>> | null = null

function getDB(): Promise<IDBPDatabase<KanjiRenshuuDB>> {
  if (!dbPromise) {
    dbPromise = openDB<KanjiRenshuuDB>(DB_NAME, LATEST_DB_VERSION, {
      upgrade(db, oldVersion, newVersion, tx) {
        void runMigrations(db, tx, oldVersion, newVersion ?? LATEST_DB_VERSION)
      },
    })
  }
  return dbPromise
}

/** Test-only: reset the cached connection so a fresh DB can be opened. */
export function _resetDbForTests(): void {
  dbPromise = null
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
  const all = await db.getAll('cards')
  return all.filter(card => card.introduced)
}

export async function getCardCount(): Promise<number> {
  const db = await getDB()
  return db.count('cards')
}

// --- Review Logs ---

export async function addReviewLog(log: ReviewLogEntry): Promise<void> {
  const db = await getDB()
  // Defensive: callers should set `date`, but we backfill from timestamp
  // so older code paths and JSON imports stay safe.
  const withDate: ReviewLogEntry = log.date
    ? log
    : { ...log, date: isoDateFromTimestamp(log.timestamp) }
  await db.add('reviewLogs', withDate)
}

export async function getReviewLogsByDate(date: string): Promise<ReviewLogEntry[]> {
  const db = await getDB()
  return db.getAllFromIndex('reviewLogs', 'by-date', date)
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
