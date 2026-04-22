import type { IDBPDatabase, IDBPTransaction } from 'idb'
import type { CardState, ReviewLogEntry, DailyStats, UserStats, Deck, KanjiNote } from '@/core/srs/types'

/**
 * Schema description for the IndexedDB instance. Update this in lock-step with
 * every migration so type inference for `IDBPDatabase` / `IDBPTransaction`
 * stays accurate.
 */
export interface KanjiRenshuuDB {
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
  userStats: {
    key: string
    value: UserStats
  }
  decks: {
    key: string
    value: Deck
    indexes: { 'by-createdAt': number }
  }
  notes: {
    key: string
    value: KanjiNote
  }
}

// Use a string[] store-names parameter (rather than the narrow union) so this
// matches the tx type `idb` produces during a `versionchange` upgrade — which
// may legitimately include stores that don't exist in earlier schema versions.
type UpgradeTx = IDBPTransaction<KanjiRenshuuDB, string[], 'versionchange'>

export interface Migration {
  /** Version we are upgrading FROM (oldVersion). */
  from: number
  /** Version we are upgrading TO (newVersion). */
  to: number
  /** Human-readable description, surfaced in logs and tests. */
  description: string
  run: (db: IDBPDatabase<KanjiRenshuuDB>, tx: UpgradeTx) => void | Promise<void>
}

/**
 * Ordered list of migrations. Each migration's `from` MUST equal the previous
 * migration's `to` (or 0 for the first one). Append a new entry whenever the
 * schema changes; never edit an existing entry once it has shipped.
 */
export const migrations: Migration[] = [
  {
    from: 0,
    to: 1,
    description: 'Initial schema: cards, reviewLogs, dailyStats',
    run: (db) => {
      const cardStore = db.createObjectStore('cards', { keyPath: 'kanjiLiteral' })
      cardStore.createIndex('by-introduced', 'introduced')

      const logStore = db.createObjectStore('reviewLogs', { keyPath: 'id' })
      logStore.createIndex('by-kanji', 'kanjiLiteral')
      logStore.createIndex('by-timestamp', 'timestamp')

      db.createObjectStore('dailyStats', { keyPath: 'date' })
    },
  },
  {
    from: 1,
    to: 2,
    description: 'Add by-date index on reviewLogs and backfill date field',
    run: async (_db, tx) => {
      const logStore = tx.objectStore('reviewLogs')

      // Backfill `date` on every existing record (computed from `timestamp`).
      let cursor = await logStore.openCursor()
      while (cursor) {
        const record = cursor.value as ReviewLogEntry & { date?: string }
        if (!record.date) {
          record.date = isoDateFromTimestamp(record.timestamp)
          await cursor.update(record)
        }
        cursor = await cursor.continue()
      }

      // Then create the index that depends on the field.
      if (!logStore.indexNames.contains('by-date')) {
        logStore.createIndex('by-date', 'date')
      }
    },
  },
  {
    from: 2,
    to: 3,
    description: 'Add userStats store and backfill lifetimeXp from dailyStats',
    run: async (db, tx) => {
      if (!db.objectStoreNames.contains('userStats')) {
        db.createObjectStore('userStats', { keyPath: 'id' })
      }

      // Backfill XP from existing dailyStats so returning users keep credit
      // for the work they've already done.
      let lifetimeXp = 0
      const statsStore = tx.objectStore('dailyStats')
      let cursor = await statsStore.openCursor()
      while (cursor) {
        const stat = cursor.value as DailyStats
        const correct = stat.correctCount ?? 0
        const wrong = Math.max(0, (stat.reviewsCompleted ?? 0) - correct)
        lifetimeXp += correct * 15 + wrong * 5
        cursor = await cursor.continue()
      }

      const userStatsStore = tx.objectStore('userStats')
      await userStatsStore.put({
        id: 'singleton',
        lifetimeXp,
        freezes: 0,
        updatedAt: Date.now(),
      } satisfies UserStats)
    },
  },
  {
    from: 3,
    to: 4,
    description: 'Add decks store for user-defined custom queues',
    run: (db) => {
      if (!db.objectStoreNames.contains('decks')) {
        const store = db.createObjectStore('decks', { keyPath: 'id' })
        store.createIndex('by-createdAt', 'createdAt')
      }
    },
  },
  {
    from: 4,
    to: 5,
    description: 'Add notes store for user-editable mnemonics',
    run: (db) => {
      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'kanjiLiteral' })
      }
    },
  },
]

/** Latest schema version — the maximum `to` across all migrations. */
export const LATEST_DB_VERSION: number = migrations[migrations.length - 1]!.to

/**
 * Apply every migration whose `from >= oldVersion` and `to <= newVersion`.
 * Called from the `idb` `upgrade` callback.
 */
export async function runMigrations(
  db: IDBPDatabase<KanjiRenshuuDB>,
  tx: UpgradeTx,
  oldVersion: number,
  newVersion: number,
): Promise<void> {
  validateMigrations()
  for (const m of migrations) {
    if (m.from >= oldVersion && m.to <= newVersion) {
      await m.run(db, tx)
    }
  }
}

/**
 * Sanity-check the migrations array at runtime so a malformed entry fails
 * loudly during development rather than silently corrupting a user's DB.
 */
export function validateMigrations(list: Migration[] = migrations): void {
  for (let i = 0; i < list.length; i++) {
    const m = list[i]!
    if (m.to !== m.from + 1) {
      throw new Error(
        `Migration "${m.description}" must bump version by exactly 1 ` +
          `(from=${m.from}, to=${m.to})`,
      )
    }
    if (i === 0) {
      if (m.from !== 0) {
        throw new Error(`First migration must start from 0, got ${m.from}`)
      }
    } else {
      const prev = list[i - 1]!
      if (m.from !== prev.to) {
        throw new Error(
          `Migration "${m.description}" (from=${m.from}) does not chain ` +
            `from previous migration "${prev.description}" (to=${prev.to})`,
        )
      }
    }
  }
}

/** YYYY-MM-DD in UTC, matching the convention used elsewhere in storage. */
export function isoDateFromTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0]!
}
