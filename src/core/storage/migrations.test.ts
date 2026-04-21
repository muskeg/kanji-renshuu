import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { openDB, deleteDB } from 'idb'
import {
  migrations,
  validateMigrations,
  isoDateFromTimestamp,
  LATEST_DB_VERSION,
  runMigrations,
  type KanjiRenshuuDB,
} from './migrations'

const DB_NAME = 'test-kanji-renshuu'

async function reset(): Promise<void> {
  await deleteDB(DB_NAME)
}

describe('migrations array', () => {
  it('is well-formed (sequential, starts at 0, +1 per step)', () => {
    expect(() => validateMigrations()).not.toThrow()
  })

  it('rejects a non-sequential migration list', () => {
    expect(() =>
      validateMigrations([
        { from: 0, to: 1, description: 'a', run: () => {} },
        { from: 2, to: 3, description: 'b', run: () => {} },
      ]),
    ).toThrow(/does not chain/)
  })

  it('rejects a migration that bumps by more than 1', () => {
    expect(() =>
      validateMigrations([{ from: 0, to: 2, description: 'big', run: () => {} }]),
    ).toThrow(/bump version by exactly 1/)
  })

  it('exposes LATEST_DB_VERSION matching the last migration', () => {
    expect(LATEST_DB_VERSION).toBe(migrations[migrations.length - 1]!.to)
  })
})

describe('isoDateFromTimestamp', () => {
  it('formats UTC YYYY-MM-DD', () => {
    const ts = Date.UTC(2026, 3, 21, 14, 30) // April 21, 2026
    expect(isoDateFromTimestamp(ts)).toBe('2026-04-21')
  })
})

describe('schema upgrade v1 -> v2 (real IndexedDB via fake-indexeddb)', () => {
  beforeEach(reset)

  it('adds the by-date index on reviewLogs', async () => {
    // Open at v1 first to seed the legacy schema.
    const v1 = await openDB<KanjiRenshuuDB>(DB_NAME, 1, {
      upgrade(db, oldVersion, newVersion, tx) {
        void runMigrations(db, tx, oldVersion, newVersion ?? 1)
      },
    })
    const indexNamesBefore = Array.from(v1.transaction('reviewLogs').store.indexNames)
    expect(indexNamesBefore).not.toContain('by-date')
    v1.close()

    // Reopen at the latest version to trigger v1 -> v2.
    const v2 = await openDB<KanjiRenshuuDB>(DB_NAME, LATEST_DB_VERSION, {
      upgrade(db, oldVersion, newVersion, tx) {
        void runMigrations(db, tx, oldVersion, newVersion ?? LATEST_DB_VERSION)
      },
    })
    const indexNamesAfter = Array.from(v2.transaction('reviewLogs').store.indexNames)
    expect(indexNamesAfter).toContain('by-date')
    v2.close()
  })

  it('backfills `date` on existing review logs', async () => {
    // Seed v1 with a log that has no `date` field.
    const v1 = await openDB<KanjiRenshuuDB>(DB_NAME, 1, {
      upgrade(db, oldVersion, newVersion, tx) {
        void runMigrations(db, tx, oldVersion, newVersion ?? 1)
      },
    })
    const ts = Date.UTC(2026, 0, 15, 12)
    const legacyLog = {
      id: 'legacy-1',
      kanjiLiteral: '人',
      rating: 3,
      mode: 'recognition',
      timestamp: ts,
      responseTimeMs: 1500,
      fsrsLog: {} as never,
    }
    // Cast to bypass the new required `date` field — this simulates a v1 record.
    await v1.add('reviewLogs', legacyLog as never)
    v1.close()

    // Trigger upgrade.
    const v2 = await openDB<KanjiRenshuuDB>(DB_NAME, LATEST_DB_VERSION, {
      upgrade(db, oldVersion, newVersion, tx) {
        void runMigrations(db, tx, oldVersion, newVersion ?? LATEST_DB_VERSION)
      },
    })

    const restored = await v2.get('reviewLogs', 'legacy-1')
    expect(restored).toBeDefined()
    expect(restored!.date).toBe('2026-01-15')

    // And the new index works.
    const byDate = await v2.getAllFromIndex('reviewLogs', 'by-date', '2026-01-15')
    expect(byDate).toHaveLength(1)
    expect(byDate[0]!.id).toBe('legacy-1')
    v2.close()
  })

  it('preserves cards and dailyStats during upgrade', async () => {
    const v1 = await openDB<KanjiRenshuuDB>(DB_NAME, 1, {
      upgrade(db, oldVersion, newVersion, tx) {
        void runMigrations(db, tx, oldVersion, newVersion ?? 1)
      },
    })
    await v1.add('cards', {
      kanjiLiteral: '人',
      // minimal fsrsCard fields are not validated by the schema.
      fsrsCard: { due: new Date() } as never,
      lastReviewedAt: null,
      totalReviews: 0,
      correctReviews: 0,
      introduced: false,
      introducedAt: null,
    } as never)
    await v1.add('dailyStats', {
      date: '2026-01-15',
      newCardsIntroduced: 1,
      reviewsCompleted: 5,
      correctCount: 4,
      totalTimeMs: 12345,
    })
    v1.close()

    const v2 = await openDB<KanjiRenshuuDB>(DB_NAME, LATEST_DB_VERSION, {
      upgrade(db, oldVersion, newVersion, tx) {
        void runMigrations(db, tx, oldVersion, newVersion ?? LATEST_DB_VERSION)
      },
    })
    const card = await v2.get('cards', '人')
    const stat = await v2.get('dailyStats', '2026-01-15')
    expect(card?.kanjiLiteral).toBe('人')
    expect(stat?.reviewsCompleted).toBe(5)
    v2.close()
  })
})
