import { useEffect, useState } from 'react'
import { getNote, putNote, deleteNote, NOTE_MAX_LENGTH, NOTES_CHANGED_EVENT } from '@/core/storage/notes'
import { renderMnemonic } from '@/utils/mnemonic'
import styles from './MnemonicEditor.module.css'

interface Props {
  literal: string
}

/**
 * Inline mnemonic editor with view/edit modes.
 * Stores the note in IndexedDB via the notes store.
 */
export function MnemonicEditor({ literal }: Props) {
  const [content, setContent] = useState('')
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getNote(literal).then((note) => {
      if (cancelled) return
      setContent(note?.content ?? '')
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [literal])

  function startEdit() {
    setDraft(content)
    setEditing(true)
  }

  async function save() {
    const trimmed = draft.trim()
    if (trimmed.length === 0) {
      await deleteNote(literal)
      setContent('')
    } else {
      const note = await putNote(literal, trimmed)
      setContent(note.content)
    }
    setEditing(false)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(NOTES_CHANGED_EVENT, { detail: { literal } }))
    }
  }

  function cancel() {
    setDraft(content)
    setEditing(false)
  }

  if (loading) return null

  return (
    <section className={styles.section} aria-label="Mnemonic notes">
      <div className={styles.header}>
        <h3 className={styles.title}>My mnemonic</h3>
        <div className={styles.actions}>
          {editing ? (
            <>
              <button type="button" className={styles.cancelButton} onClick={cancel}>Cancel</button>
              <button type="button" className={styles.saveButton} onClick={save}>Save</button>
            </>
          ) : (
            <button type="button" className={styles.editButton} onClick={startEdit}>
              {content ? 'Edit' : 'Add'}
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <>
          <textarea
            className={styles.textarea}
            value={draft}
            maxLength={NOTE_MAX_LENGTH}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a memory hook… **bold**, *italic*, `code` supported."
            aria-label="Mnemonic content"
          />
          <div className={styles.hint}>
            <span>Markdown subset: **bold**, *italic*, `code`</span>
            <span>{draft.length} / {NOTE_MAX_LENGTH}</span>
          </div>
        </>
      ) : (
        <div
          className={styles.body}
          // Sanitized via renderMnemonic — only emits a fixed set of tags from escaped input.
          dangerouslySetInnerHTML={
            content
              ? { __html: renderMnemonic(content) }
              : { __html: `<span class="${styles.placeholder}">No mnemonic yet. Add one to make this kanji stick.</span>` }
          }
        />
      )}
    </section>
  )
}
