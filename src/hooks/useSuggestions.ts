import { useState, useEffect } from 'react'
import type { QueueStatus, QuizMode } from '@/core/srs/types'
import { getReviewLogsByDate, todayDateString } from '@/core/storage/db'

export interface Suggestion {
  icon: string
  text: string
  action?: QuizMode | 'start'
}

const ALL_MODES: QuizMode[] = ['recognition', 'meaning', 'reading', 'writing']

const MODE_LABELS: Record<QuizMode, string> = {
  recognition: 'Flashcards',
  meaning: 'Meaning Quiz',
  reading: 'Reading Quiz',
  writing: 'Writing Practice',
}

export function useSuggestions(status: QueueStatus | null): Suggestion[] {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  useEffect(() => {
    if (!status) return

    let cancelled = false

    async function compute() {
      const result: Suggestion[] = []
      const today = todayDateString()

      const logs = await getReviewLogsByDate(today)

      if (cancelled) return

      // 1. Due reviews — always first
      const dueCount = status!.items.length
      if (dueCount > 0) {
        result.push({
          icon: '📋',
          text: `${dueCount} review${dueCount === 1 ? '' : 's'} due — clear your queue first`,
          action: 'start',
        })
      }

      // 2. Mode the user hasn't used today
      const usedModes = new Set(logs.map(l => l.mode))
      const unusedModes = ALL_MODES.filter(m => !usedModes.has(m))
      if (unusedModes.length > 0 && unusedModes.length < ALL_MODES.length) {
        // Only suggest if user has used at least one mode (not first visit)
        const suggest = unusedModes[0]!
        result.push({
          icon: '🎯',
          text: `Try ${MODE_LABELS[suggest]} — you haven't used it today`,
          action: suggest,
        })
      }

      // 3. Grade completion proximity — infer from queue items
      const gradeMap = new Map<number, number>()
      for (const item of status!.items) {
        const g = item.kanji.grade
        gradeMap.set(g, (gradeMap.get(g) ?? 0) + 1)
      }

      if (gradeMap.size > 0) {
        // Find the grade with the most items in the queue
        const [topGrade, count] = [...gradeMap.entries()]
          .sort((a, b) => b[1] - a[1])[0]!
        if (count >= 3) {
          const label = topGrade === 8 ? 'Secondary' : `Grade ${topGrade}`
          result.push({
            icon: '🏅',
            text: `${label}: ${count} cards due — focus here to progress!`,
          })
        }
      }

      if (!cancelled) {
        setSuggestions(result.slice(0, 3))
      }
    }

    compute()
    return () => { cancelled = true }
  }, [status])

  return suggestions
}
