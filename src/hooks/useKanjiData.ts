import { useState, useEffect } from 'react'
import type { KanjiEntry } from '@/core/srs/types'
import { loadAllKanji } from '@/data/loader'

export function useKanjiData() {
  const [kanji, setKanji] = useState<KanjiEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await loadAllKanji()
        if (!cancelled) {
          setKanji(data)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load kanji data')
          setLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { kanji, loading, error }
}
