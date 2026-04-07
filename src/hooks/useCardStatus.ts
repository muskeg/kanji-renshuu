import { useState, useEffect } from 'react'
import { getAllCardStates } from '@/core/storage/db'
import type { CardState } from '@/core/srs/types'

export type CardSrsStatus = 'new' | 'learning' | 'mature' | 'overdue'

function computeStatus(card: CardState, now: Date): CardSrsStatus {
  if (!card.introduced) return 'new'
  if (new Date(card.fsrsCard.due) < now) return 'overdue'
  if (card.fsrsCard.stability >= 21) return 'mature'
  return 'learning'
}

export function useCardStatus() {
  const [statusMap, setStatusMap] = useState<Map<string, CardSrsStatus>>(new Map())

  useEffect(() => {
    getAllCardStates().then(cards => {
      const now = new Date()
      const map = new Map<string, CardSrsStatus>()
      for (const card of cards) {
        map.set(card.kanjiLiteral, computeStatus(card, now))
      }
      setStatusMap(map)
    })
  }, [])

  return statusMap
}
