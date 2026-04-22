import { openDB, type IDBPDatabase } from 'idb'
import type { CardState, ReviewLogEntry, DailyStats, UserStats } from '@/core/srs/types'
import {
  type KanjiRenshuuDB,
  LATEST_DB_VERSION,
  isoDateFromTimestamp,
  runMigrations,
} from './migrations'

const DB_NAME = 'kanji-renshuu'

let dbPromise: Promise<IDBPDatabase<KanjiRenshuuDB>> | null = null

export function getDB(): Promise<IDBPDatabase<KanjiRenshuuDB>> {
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
export async function _resetDbForTests(): Promise<void> {
  if (dbPromise) {
    try {
      const db = await dbPromise
      db.close()
    } catch {
      // ignore — the connection was already invalid
    }
  }
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

export async function getAllReviewLogs(): Promise<ReviewLogEntry[]> {
  const db = await getDB()
  return db.getAll('reviewLogs')
}

/** Fetch the most recent review log entry, or undefined if none exist. */
export async function getLastReviewLog(): Promise<ReviewLogEntry | undefined> {
  const db = await getDB()
  const all = await db.getAll('reviewLogs')
  if (all.length === 0) return undefined
  return all.reduce((latest, entry) => (entry.timestamp > latest.timestamp ? entry : latest))
}

/** Remove a single review log entry by id. */
export async function deleteReviewLog(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('reviewLogs', id)
}

/** Remove a card state entirely (used when undoing a brand-new introduction). */
export async function deleteCardState(kanjiLiteral: string): Promise<void> {
  const db = await getDB()
  await db.delete('cards', kanjiLiteral)
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

// --- User Stats (gamification) ---

const USER_STATS_KEY = 'singleton'

export async function getUserStats(): Promise<UserStats> {
  const db = await getDB()
  const existing = await db.get('userStats', USER_STATS_KEY)
  if (existing) return existing
  const fresh: UserStats = {
    id: 'singleton',
    lifetimeXp: 0,
    freezes: 0,
    updatedAt: Date.now(),
  }
  await db.put('userStats', fresh)
  return fresh
}

export async function putUserStats(stats: UserStats): Promise<void> {
  const db = await getDB()
  await db.put('userStats', stats)
}

// --- Utility ---

export function todayDateString(): string {
  return new Date().toISOString().split('T')[0]!
}

export function generateId(): string {
  return crypto.randomUUID()
}
