import { useState, useCallback, useRef, useEffect } from 'react'
import type {
  ReviewItem,
  ReviewedCard,
  RatingValue,
  SessionPhase,
  SessionSummaryData,
  QueueStatus,
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
  reviewedCards: ReviewedCard[]
  newCardsCount: number
  sessionStartTime: number
  summary: SessionSummaryData | null
  queueStatus: QueueStatus | null
}

export function useReviewSession(kanjiData: KanjiEntry[]) {
  const [state, setState] = useState<ReviewSessionState>({
    phase: 'idle',
    queue: [],
    currentIndex: 0,
    isFlipped: false,
    ratings: [],
    reviewedCards: [],
    newCardsCount: 0,
    sessionStartTime: 0,
    summary: null,
    queueStatus: null,
  })

  const cardStartTimeRef = useRef<number>(0)

  // Prefetch queue status on mount so idle screen shows context
  useEffect(() => {
    if (kanjiData.length === 0) return
    const settings = loadSettings()
    buildReviewQueue(kanjiData, settings.dailyNewCards).then(queueStatus => {
      setState(prev => {
        if (prev.phase !== 'idle') return prev
        return { ...prev, queueStatus }
      })
    })
  }, [kanjiData])

  const startSession = useCallback(async () => {
    const settings = loadSettings()
    const queueStatus = await buildReviewQueue(kanjiData, settings.dailyNewCards)

    if (queueStatus.items.length === 0) {
      setState(prev => ({ ...prev, phase: 'idle', summary: null, queueStatus }))
      return
    }

    const newCount = queueStatus.items.filter(item => !item.cardState.introduced).length

    setState({
      phase: 'reviewing',
      queue: queueStatus.items,
      currentIndex: 0,
      isFlipped: false,
      ratings: [],
      reviewedCards: [],
      newCardsCount: newCount,
      sessionStartTime: Date.now(),
      summary: null,
      queueStatus,
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
    const newReviewedCards: ReviewedCard[] = [...state.reviewedCards, {
      kanjiLiteral: currentItem.kanji.literal,
      rating,
      meanings: currentItem.kanji.meanings,
      readings: {
        onYomi: currentItem.kanji.readings.onYomi,
        kunYomi: currentItem.kanji.readings.kunYomi,
      },
    }]
    const nextIndex = state.currentIndex + 1

    if (nextIndex >= state.queue.length) {
      // Session complete
      const totalTimeMs = Date.now() - state.sessionStartTime
      const summary = computeSessionSummary(newRatings, newReviewedCards, state.newCardsCount, totalTimeMs)
      setState(prev => ({
        ...prev,
        phase: 'summary',
        ratings: newRatings,
        reviewedCards: newReviewedCards,
        summary,
        isFlipped: false,
      }))
    } else {
      setState(prev => ({
        ...prev,
        currentIndex: nextIndex,
        isFlipped: false,
        ratings: newRatings,
        reviewedCards: newReviewedCards,
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
      reviewedCards: [],
      newCardsCount: 0,
      sessionStartTime: 0,
      summary: null,
      queueStatus: null,
    })
  }, [])

  // 5B-1: Retry only struggled (Again/Hard) cards
  const retryStruggled = useCallback(() => {
    const struggled = state.queue.filter((_, i) => {
      const rating = state.ratings[i]
      return rating !== undefined && rating <= 2
    })
    if (struggled.length === 0) return

    setState({
      phase: 'reviewing',
      queue: struggled,
      currentIndex: 0,
      isFlipped: false,
      ratings: [],
      reviewedCards: [],
      newCardsCount: 0,
      sessionStartTime: Date.now(),
      summary: null,
      queueStatus: state.queueStatus,
    })
    cardStartTimeRef.current = Date.now()
  }, [state.queue, state.ratings, state.queueStatus])

  // 5B-1: Start a fresh session
  const startNewSession = useCallback(async () => {
    const settings = loadSettings()
    const queueStatus = await buildReviewQueue(kanjiData, settings.dailyNewCards)
    if (queueStatus.items.length === 0) {
      setState(prev => ({ ...prev, phase: 'idle', summary: null, queueStatus }))
      return
    }
    const newCount = queueStatus.items.filter(item => !item.cardState.introduced).length
    setState({
      phase: 'reviewing',
      queue: queueStatus.items,
      currentIndex: 0,
      isFlipped: false,
      ratings: [],
      reviewedCards: [],
      newCardsCount: newCount,
      sessionStartTime: Date.now(),
      summary: null,
      queueStatus,
    })
    cardStartTimeRef.current = Date.now()
  }, [kanjiData])

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

  const hasStruggledCards = state.ratings.some(r => r <= 2)

  return {
    phase: state.phase,
    currentItem,
    currentIndex: state.currentIndex,
    totalCards: state.queue.length,
    isFlipped: state.isFlipped,
    summary: state.summary,
    queueStatus: state.queueStatus,
    startSession,
    flipCard,
    rateCard,
    endSession,
    retryStruggled: hasStruggledCards ? retryStruggled : null,
    startNewSession,
  }
}
