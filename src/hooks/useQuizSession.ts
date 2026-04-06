import { useState, useCallback, useRef } from 'react'
import type {
  ReviewItem,
  RatingValue,
  SessionPhase,
  SessionSummaryData,
  KanjiEntry,
  QuizMode,
} from '@/core/srs/types'
import { buildReviewQueue, processReview, computeSessionSummary } from '@/core/srs/session'
import { loadSettings } from '@/core/storage/settings'

interface QuizSessionState {
  phase: SessionPhase
  queue: ReviewItem[]
  currentIndex: number
  ratings: RatingValue[]
  newCardsCount: number
  sessionStartTime: number
  summary: SessionSummaryData | null
}

export function useQuizSession(kanjiData: KanjiEntry[], mode: QuizMode) {
  const [state, setState] = useState<QuizSessionState>({
    phase: 'idle',
    queue: [],
    currentIndex: 0,
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
      ratings: [],
      newCardsCount: newCount,
      sessionStartTime: Date.now(),
      summary: null,
    })
    cardStartTimeRef.current = Date.now()
  }, [kanjiData])

  const rateCard = useCallback(async (rating: RatingValue) => {
    const currentItem = state.queue[state.currentIndex]
    if (!currentItem || state.phase !== 'reviewing') return

    const responseTimeMs = Date.now() - cardStartTimeRef.current

    await processReview(currentItem, rating, mode, responseTimeMs)

    const newRatings = [...state.ratings, rating]
    const nextIndex = state.currentIndex + 1

    if (nextIndex >= state.queue.length) {
      const totalTimeMs = Date.now() - state.sessionStartTime
      const summary = computeSessionSummary(newRatings, state.newCardsCount, totalTimeMs)
      setState(prev => ({
        ...prev,
        phase: 'summary',
        ratings: newRatings,
        summary,
      }))
    } else {
      setState(prev => ({
        ...prev,
        currentIndex: nextIndex,
        ratings: newRatings,
      }))
      cardStartTimeRef.current = Date.now()
    }
  }, [state, mode])

  const endSession = useCallback(() => {
    setState({
      phase: 'idle',
      queue: [],
      currentIndex: 0,
      ratings: [],
      newCardsCount: 0,
      sessionStartTime: 0,
      summary: null,
    })
  }, [])

  const currentItem = state.queue[state.currentIndex] ?? null

  return {
    phase: state.phase,
    currentItem,
    currentIndex: state.currentIndex,
    totalCards: state.queue.length,
    summary: state.summary,
    startSession,
    rateCard,
    endSession,
  }
}
