import { useState, useEffect } from 'react'
import { getAllCardStates } from '@/core/storage/db'
import { loadAllKanji } from '@/data/loader'

export interface ActiveGrade {
  grade: number
  introduced: number
  total: number
}

async function fetchActiveGrade(): Promise<ActiveGrade | null> {
  const [cards, allKanji] = await Promise.all([
    getAllCardStates(),
    loadAllKanji(),
  ])

  const introducedSet = new Set(
    cards.filter(c => c.introduced).map(c => c.kanjiLiteral),
  )

  const gradeCounts = new Map<number, { total: number; introduced: number }>()
  for (const k of allKanji) {
    const entry = gradeCounts.get(k.grade) ?? { total: 0, introduced: 0 }
    entry.total++
    if (introducedSet.has(k.literal)) entry.introduced++
    gradeCounts.set(k.grade, entry)
  }

  // Return lowest grade that's not fully introduced
  for (const grade of [1, 2, 3, 4, 5, 6, 8]) {
    const entry = gradeCounts.get(grade)
    if (entry && entry.introduced < entry.total) {
      return { grade, introduced: entry.introduced, total: entry.total }
    }
  }

  return null
}

export function useActiveGrade(): ActiveGrade | null {
  const [activeGrade, setActiveGrade] = useState<ActiveGrade | null>(null)

  useEffect(() => {
    fetchActiveGrade().then(setActiveGrade)

    function handleReviewComplete() {
      fetchActiveGrade().then(setActiveGrade)
    }

    window.addEventListener('kanji-review-complete', handleReviewComplete)
    return () => {
      window.removeEventListener('kanji-review-complete', handleReviewComplete)
    }
  }, [])

  return activeGrade
}
