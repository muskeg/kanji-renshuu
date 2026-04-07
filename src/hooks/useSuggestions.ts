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

      // 1. Cards ready — differentiate reviews vs new
      const items = status!.items
      const reviewCount = items.filter(i => i.cardState.introduced).length
      const newCount = items.length - reviewCount
      if (reviewCount > 0) {
        result.push({
          icon: '📋',
          text: `${reviewCount} review${reviewCount === 1 ? '' : 's'} due — clear your queue first`,
          action: 'start',
        })
      } else if (newCount > 0) {
        result.push({
          icon: '✨',
          text: `${newCount} new kanji ready to learn`,
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

      // 3. Grade focus — only show if reviews span multiple grades
      if (reviewCount > 0) {
        const gradeMap = new Map<number, number>()
        for (const item of items.filter(i => i.cardState.introduced)) {
          const g = item.kanji.grade
          gradeMap.set(g, (gradeMap.get(g) ?? 0) + 1)
        }

        if (gradeMap.size > 1) {
          const [topGrade, count] = [...gradeMap.entries()]
            .sort((a, b) => b[1] - a[1])[0]!
          const label = topGrade === 8 ? 'Secondary' : `Grade ${topGrade}`
          result.push({
            icon: '🏅',
            text: `${label}: ${count} reviews — your most active grade`,
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
