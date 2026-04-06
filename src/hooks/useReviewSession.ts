import { useState, useCallback, useRef, useEffect } from 'react'
import type {
  ReviewItem,
  RatingValue,
  SessionPhase,
  SessionSummaryData,
  KanjiEntry,
} from '@/core/srs/types'
import { buildReviewQueue, processReview, computeSessionSummary } from '@/core/srs/session'
import { loadSettings } from '@/core/storage/settings'

interface ReviewSessionState {
  phase: SessionPhase
  queue: ReviewItem[]
  currentIndex: number
  isFlipped: boolean
  ratings: RatingValue[]
  newCardsCount: number
  sessionStartTime: number
  summary: SessionSummaryData | null
}

export function useReviewSession(kanjiData: KanjiEntry[]) {
  const [state, setState] = useState<ReviewSessionState>({
    phase: 'idle',
    queue: [],
    currentIndex: 0,
    isFlipped: false,
    ratings: [],
    newCardsCount: 0,
    sessionStartTime: 0,
    summary: null,
  })

  const cardStartTimeRef = useRef<number>(0)

  const startSession = useCallback(async () => {
    const settings = loadSettings()
    const queue = await buildReviewQueue(kanjiData, settings.dailyNewCards)

    if (queue.length === 0) {
      setState(prev => ({ ...prev, phase: 'idle', summary: null }))
      return
    }

    const newCount = queue.filter(item => !item.cardState.introduced).length

    setState({
      phase: 'reviewing',
      queue,
      currentIndex: 0,
      isFlipped: false,
      ratings: [],
      newCardsCount: newCount,
      sessionStartTime: Date.now(),
      summary: null,
    })
    cardStartTimeRef.current = Date.now()
  }, [kanjiData])

  const flipCard = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'reviewing' || prev.isFlipped) return prev
      return { ...prev, isFlipped: true }
    })
  }, [])

  const rateCard = useCallback(async (rating: RatingValue) => {
    const currentItem = state.queue[state.currentIndex]
    if (!currentItem || state.phase !== 'reviewing' || !state.isFlipped) return

    const responseTimeMs = Date.now() - cardStartTimeRef.current

    await processReview(currentItem, rating, 'recognition', responseTimeMs)

    const newRatings = [...state.ratings, rating]
    const nextIndex = state.currentIndex + 1

    if (nextIndex >= state.queue.length) {
      // Session complete
      const totalTimeMs = Date.now() - state.sessionStartTime
      const summary = computeSessionSummary(newRatings, state.newCardsCount, totalTimeMs)
      setState(prev => ({
        ...prev,
        phase: 'summary',
        ratings: newRatings,
        summary,
        isFlipped: false,
      }))
    } else {
      setState(prev => ({
        ...prev,
        currentIndex: nextIndex,
        isFlipped: false,
        ratings: newRatings,
      }))
      cardStartTimeRef.current = Date.now()
    }
  }, [state])

  const endSession = useCallback(() => {
    setState({
      phase: 'idle',
      queue: [],
      currentIndex: 0,
      isFlipped: false,
      ratings: [],
      newCardsCount: 0,
      sessionStartTime: 0,
      summary: null,
    })
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (state.phase !== 'reviewing') return

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (!state.isFlipped) {
          flipCard()
        }
      } else if (state.isFlipped) {
        const keyMap: Record<string, RatingValue> = { '1': 1, '2': 2, '3': 3, '4': 4 }
        const rating = keyMap[e.key]
        if (rating) {
          e.preventDefault()
          rateCard(rating)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.phase, state.isFlipped, flipCard, rateCard])

  const currentItem = state.queue[state.currentIndex] ?? null

  return {
    phase: state.phase,
    currentItem,
    currentIndex: state.currentIndex,
    totalCards: state.queue.length,
    isFlipped: state.isFlipped,
    summary: state.summary,
    startSession,
    flipCard,
    rateCard,
    endSession,
  }
}
