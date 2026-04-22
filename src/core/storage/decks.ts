/**
 * CRUD for user-defined kanji decks.
 *
 * Decks are stored in the `decks` IDB object store (introduced in schema v4).
 * Each deck carries a `DeckFilter` describing which kanji it contains; the
 * filter is evaluated at session-start time against the loaded kanji dataset
 * so changes to the underlying data automatically flow through.
 */

import type { Deck, DeckFilter, KanjiEntry } from '@/core/srs/types'
import { getDB } from './db'

/** Custom event fired whenever the deck list changes (create/update/delete). */
export const DECKS_CHANGED_EVENT = 'kanji-renshuu-decks-change'

function emitChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DECKS_CHANGED_EVENT))
  }
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `deck-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

let lastCreatedAt = 0
function nextCreatedAt(): number {
  const now = Date.now()
  lastCreatedAt = now > lastCreatedAt ? now : lastCreatedAt + 1
  return lastCreatedAt
}

export async function listDecks(): Promise<Deck[]> {
  const db = await getDB()
  const all = await db.getAll('decks')
  return all.sort((a, b) => a.createdAt - b.createdAt)
}

export async function getDeck(id: string): Promise<Deck | undefined> {
  const db = await getDB()
  return db.get('decks', id)
}

export async function createDeck(input: { name: string; color: string; filter: DeckFilter }): Promise<Deck> {
  const now = nextCreatedAt()
  const deck: Deck = {
    id: newId(),
    name: input.name.trim() || 'Untitled deck',
    color: input.color,
    filter: normalizeFilter(input.filter),
    createdAt: now,
    updatedAt: now,
  }
  const db = await getDB()
  await db.put('decks', deck)
  emitChange()
  return deck
}

export async function updateDeck(id: string, patch: Partial<Pick<Deck, 'name' | 'color' | 'filter'>>): Promise<Deck | undefined> {
  const db = await getDB()
  const existing = await db.get('decks', id)
  if (!existing) return undefined
  const updated: Deck = {
    ...existing,
    ...patch,
    filter: patch.filter ? normalizeFilter(patch.filter) : existing.filter,
    name: (patch.name ?? existing.name).trim() || existing.name,
    updatedAt: Date.now(),
  }
  await db.put('decks', updated)
  emitChange()
  return updated
}

export async function deleteDeck(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('decks', id)
  emitChange()
}

function normalizeFilter(filter: DeckFilter): DeckFilter {
  return {
    grades: [...new Set(filter.grades)].sort((a, b) => a - b),
    jlptLevels: [...new Set(filter.jlptLevels)].sort((a, b) => a - b),
    literals: filter.literals && filter.literals.length > 0
      ? [...new Set(filter.literals)]
      : undefined,
  }
}

/**
 * Apply a `DeckFilter` to a kanji pool. Mirrors browse-view filtering
 * semantics: literals (when provided) are an explicit allowlist; otherwise
 * grades and jlptLevels are AND-combined when both are non-empty. Empty
 * arrays mean "no restriction on this dimension".
 */
export function applyDeckFilter(pool: KanjiEntry[], filter: DeckFilter): KanjiEntry[] {
  if (filter.literals && filter.literals.length > 0) {
    const set = new Set(filter.literals)
    return pool.filter(k => set.has(k.literal))
  }
  let result = pool
  if (filter.grades.length > 0) {
    const grades = new Set(filter.grades)
    result = result.filter(k => grades.has(k.grade))
  }
  if (filter.jlptLevels.length > 0) {
    const levels = new Set(filter.jlptLevels)
    result = result.filter(k => k.jlptN !== null && levels.has(k.jlptN))
  }
  return result
}
