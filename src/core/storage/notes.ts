import type { KanjiNote } from '@/core/srs/types'
import { getDB } from './db'

export const NOTE_MAX_LENGTH = 1500

export const NOTES_CHANGED_EVENT = 'kanji-renshuu-notes-change'

function emitChange(literal: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NOTES_CHANGED_EVENT, { detail: { literal } }))
  }
}

export async function getNote(literal: string): Promise<KanjiNote | undefined> {
  const db = await getDB()
  return db.get('notes', literal)
}

export async function putNote(literal: string, content: string): Promise<KanjiNote> {
  const trimmed = content.slice(0, NOTE_MAX_LENGTH)
  const note: KanjiNote = {
    kanjiLiteral: literal,
    content: trimmed,
    updatedAt: Date.now(),
  }
  const db = await getDB()
  await db.put('notes', note)
  emitChange(literal)
  return note
}

export async function deleteNote(literal: string): Promise<void> {
  const db = await getDB()
  await db.delete('notes', literal)
  emitChange(literal)
}

export async function listNotes(): Promise<KanjiNote[]> {
  const db = await getDB()
  return db.getAll('notes')
}
