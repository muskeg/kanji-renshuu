import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { _resetDbForTests, getDB } from './db'
import {
  listDecks,
  getDeck,
  createDeck,
  updateDeck,
  deleteDeck,
  applyDeckFilter,
} from './decks'
import type { KanjiEntry } from '@/core/srs/types'

beforeEach(async () => {
  await _resetDbForTests()
  const db = await getDB()
  await db.clear('decks')
})

function k(literal: string, grade: number, jlptN: 1 | 2 | 3 | 4 | 5 | null = null): KanjiEntry {
  return {
    literal, grade, jlpt: null, jlptN,
    strokeCount: 1, frequency: null, radical: 1,
    readings: { onYomi: [], kunYomi: [], nanori: [] },
    meanings: [], meaningsFr: [], strokeOrderSvg: '', components: [],
  }
}

describe('decks CRUD', () => {
  it('starts empty', async () => {
    expect(await listDecks()).toEqual([])
  })

  it('creates a deck and round-trips it through getDeck', async () => {
    const deck = await createDeck({
      name: 'JLPT N5',
      color: '#ff0000',
      filter: { grades: [], jlptLevels: [5] },
    })
    expect(deck.id).toBeTruthy()
    expect(deck.createdAt).toBeGreaterThan(0)
    const fetched = await getDeck(deck.id)
    expect(fetched?.name).toBe('JLPT N5')
    expect(fetched?.filter.jlptLevels).toEqual([5])
  })

  it('lists decks in createdAt order', async () => {
    const a = await createDeck({ name: 'A', color: '#fff', filter: { grades: [1], jlptLevels: [] } })
    await new Promise(r => setTimeout(r, 2))
    const b = await createDeck({ name: 'B', color: '#000', filter: { grades: [2], jlptLevels: [] } })
    const list = await listDecks()
    expect(list.map(d => d.id)).toEqual([a.id, b.id])
  })

  it('updates name/color/filter and bumps updatedAt', async () => {
    const deck = await createDeck({ name: 'Old', color: '#aaa', filter: { grades: [1], jlptLevels: [] } })
    await new Promise(r => setTimeout(r, 2))
    const updated = await updateDeck(deck.id, { name: 'New', filter: { grades: [2, 3], jlptLevels: [4] } })
    expect(updated?.name).toBe('New')
    expect(updated?.filter.grades).toEqual([2, 3])
    expect(updated?.filter.jlptLevels).toEqual([4])
    expect(updated!.updatedAt).toBeGreaterThan(deck.updatedAt)
  })

  it('deletes a deck', async () => {
    const deck = await createDeck({ name: 'X', color: '#fff', filter: { grades: [], jlptLevels: [] } })
    await deleteDeck(deck.id)
    expect(await getDeck(deck.id)).toBeUndefined()
  })

  it('falls back to default name when input is whitespace', async () => {
    const deck = await createDeck({ name: '   ', color: '#fff', filter: { grades: [], jlptLevels: [] } })
    expect(deck.name).toBe('Untitled deck')
  })
})

describe('applyDeckFilter', () => {
  const pool = [
    k('一', 1, 5),
    k('二', 1, 5),
    k('火', 1, 4),
    k('水', 2, 4),
    k('術', 8, 1),
  ]

  it('returns the full pool when filter is empty', () => {
    expect(applyDeckFilter(pool, { grades: [], jlptLevels: [] }).length).toBe(5)
  })

  it('filters by grade', () => {
    expect(applyDeckFilter(pool, { grades: [1], jlptLevels: [] }).map(p => p.literal))
      .toEqual(['一', '二', '火'])
  })

  it('filters by JLPT N-level', () => {
    expect(applyDeckFilter(pool, { grades: [], jlptLevels: [4] }).map(p => p.literal))
      .toEqual(['火', '水'])
  })

  it('AND-combines grade and jlpt', () => {
    expect(applyDeckFilter(pool, { grades: [1], jlptLevels: [5] }).map(p => p.literal))
      .toEqual(['一', '二'])
  })

  it('treats literals[] as an explicit allowlist that overrides other filters', () => {
    expect(applyDeckFilter(pool, { grades: [99], jlptLevels: [99], literals: ['術', '水'] }).map(p => p.literal))
      .toEqual(['水', '術'])
  })
})
