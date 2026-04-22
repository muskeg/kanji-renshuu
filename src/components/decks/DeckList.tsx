import { useEffect, useState, useMemo } from 'react'
import type { Deck, DeckFilter, KanjiEntry } from '@/core/srs/types'
import {
  listDecks,
  createDeck,
  updateDeck,
  deleteDeck,
  applyDeckFilter,
  DECKS_CHANGED_EVENT,
} from '@/core/storage/decks'
import { showToast } from '@/hooks/useToast'
import styles from './DeckList.module.css'

const DECK_COLORS = [
  '#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1',
  '#5f27cd', '#ff9ff3', '#ee5253', '#10ac84',
] as const

const GRADE_OPTIONS = [1, 2, 3, 4, 5, 6, 8] as const
const JLPT_OPTIONS = [5, 4, 3, 2, 1] as const

interface DeckListProps {
  kanjiData: KanjiEntry[]
  onStudyDeck: (deck: Deck) => void
}

export function DeckList({ kanjiData, onStudyDeck }: DeckListProps) {
  const [decks, setDecks] = useState<Deck[]>([])
  const [editing, setEditing] = useState<Deck | 'new' | null>(null)

  useEffect(() => {
    let cancelled = false
    const refresh = () => {
      listDecks().then(d => {
        if (!cancelled) setDecks(d)
      })
    }
    refresh()
    if (typeof window !== 'undefined') {
      window.addEventListener(DECKS_CHANGED_EVENT, refresh)
    }
    return () => {
      cancelled = true
      if (typeof window !== 'undefined') {
        window.removeEventListener(DECKS_CHANGED_EVENT, refresh)
      }
    }
  }, [])

  const handleSave = async (input: { name: string; color: string; filter: DeckFilter }) => {
    if (editing === 'new') {
      await createDeck(input)
      showToast({ title: 'Deck created', body: input.name, icon: '✨' })
    } else if (editing) {
      await updateDeck(editing.id, input)
      showToast({ title: 'Deck updated', body: input.name, icon: '✏️' })
    }
    setEditing(null)
  }

  const handleDelete = async (deck: Deck) => {
    if (!confirm(`Delete deck "${deck.name}"?`)) return
    await deleteDeck(deck.id)
    showToast({ title: 'Deck deleted', body: deck.name, icon: '🗑️' })
  }

  if (editing) {
    return (
      <DeckEditor
        kanjiData={kanjiData}
        initial={editing === 'new' ? null : editing}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Custom Decks</h1>
        <button
          type="button"
          className={styles.newButton}
          onClick={() => setEditing('new')}
        >
          + New Deck
        </button>
      </div>
      <p className={styles.subtitle}>
        Build your own focused study queues — by grade, JLPT level, or hand-picked kanji.
      </p>

      {decks.length === 0 ? (
        <div className={styles.empty}>
          You haven't created any decks yet.
          <br />
          Click <strong>+ New Deck</strong> to start building a custom queue.
        </div>
      ) : (
        <div className={styles.list}>
          {decks.map(deck => (
            <DeckCard
              key={deck.id}
              deck={deck}
              kanjiData={kanjiData}
              onStudy={() => onStudyDeck(deck)}
              onEdit={() => setEditing(deck)}
              onDelete={() => handleDelete(deck)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DeckCard({
  deck,
  kanjiData,
  onStudy,
  onEdit,
  onDelete,
}: {
  deck: Deck
  kanjiData: KanjiEntry[]
  onStudy: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const count = useMemo(() => applyDeckFilter(kanjiData, deck.filter).length, [kanjiData, deck.filter])
  return (
    <div
      className={styles.deckCard}
      style={{ ['--deck-color' as string]: deck.color }}
    >
      <div className={styles.deckInfo}>
        <h3 className={styles.deckName}>{deck.name}</h3>
        <p className={styles.deckMeta}>
          {count.toLocaleString()} kanji · {summarizeFilter(deck.filter)}
        </p>
      </div>
      <div className={styles.deckActions}>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.primary}`}
          onClick={onStudy}
          disabled={count === 0}
        >
          Study
        </button>
        <button type="button" className={styles.actionButton} onClick={onEdit}>
          Edit
        </button>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.danger}`}
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function summarizeFilter(filter: DeckFilter): string {
  const parts: string[] = []
  if (filter.literals && filter.literals.length > 0) {
    return `${filter.literals.length} hand-picked`
  }
  if (filter.grades.length > 0) {
    parts.push(`Grade ${filter.grades.join(', ')}`)
  }
  if (filter.jlptLevels.length > 0) {
    parts.push(`JLPT N${filter.jlptLevels.join(', N')}`)
  }
  return parts.length > 0 ? parts.join(' · ') : 'All kanji'
}

interface DeckEditorProps {
  kanjiData: KanjiEntry[]
  initial: Deck | null
  onSave: (input: { name: string; color: string; filter: DeckFilter }) => void
  onCancel: () => void
}

function DeckEditor({ kanjiData, initial, onSave, onCancel }: DeckEditorProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? DECK_COLORS[0])
  const [grades, setGrades] = useState<number[]>(initial?.filter.grades ?? [])
  const [jlptLevels, setJlptLevels] = useState<number[]>(initial?.filter.jlptLevels ?? [])

  const filter: DeckFilter = useMemo(
    () => ({ grades, jlptLevels }),
    [grades, jlptLevels],
  )
  const previewCount = useMemo(
    () => applyDeckFilter(kanjiData, filter).length,
    [kanjiData, filter],
  )

  const toggle = (list: number[], value: number) =>
    list.includes(value) ? list.filter(v => v !== value) : [...list, value]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{initial ? 'Edit Deck' : 'New Deck'}</h1>
        <button type="button" className={styles.actionButton} onClick={onCancel}>
          Cancel
        </button>
      </div>
      <div className={styles.editor}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="deck-name">
            Name
          </label>
          <input
            id="deck-name"
            type="text"
            className={styles.input}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. JLPT N5 Cram"
            maxLength={60}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Color</span>
          <div className={styles.colorRow}>
            {DECK_COLORS.map(c => (
              <button
                key={c}
                type="button"
                aria-label={`Color ${c}`}
                className={`${styles.swatch} ${color === c ? styles.selected : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Grades</span>
          <div className={styles.chipRow}>
            {GRADE_OPTIONS.map(g => (
              <button
                key={g}
                type="button"
                className={`${styles.chip} ${grades.includes(g) ? styles.active : ''}`}
                onClick={() => setGrades(toggle(grades, g))}
              >
                Grade {g}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>JLPT Levels</span>
          <div className={styles.chipRow}>
            {JLPT_OPTIONS.map(n => (
              <button
                key={n}
                type="button"
                className={`${styles.chip} ${jlptLevels.includes(n) ? styles.active : ''}`}
                onClick={() => setJlptLevels(toggle(jlptLevels, n))}
              >
                N{n}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.preview}>
          <span className={styles.previewCount}>{previewCount.toLocaleString()}</span>{' '}
          kanji match this filter
        </div>

        <div className={styles.formActions}>
          <button type="button" className={styles.actionButton} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.primary}`}
            disabled={!name.trim() || previewCount === 0}
            onClick={() => onSave({ name: name.trim(), color, filter })}
          >
            {initial ? 'Save Changes' : 'Create Deck'}
          </button>
        </div>
      </div>
    </div>
  )
}
