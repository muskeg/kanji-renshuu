import { useState, useCallback, useRef } from 'react'
import type {
  ReviewItem,
  ReviewedCard,
  RatingValue,
  SessionPhase,
  SessionSummaryData,
  KanjiEntry,
  QuizMode,
} from '@/core/srs/types'
import { buildReviewQueue, processReview, computeSessionSummary } from '@/core/srs/session'
import { checkMilestones } from '@/core/srs/milestones'
import { showToast } from '@/hooks/useToast'
import { loadSettings } from '@/core/storage/settings'

interface QuizSessionState {
  phase: SessionPhase
  queue: ReviewItem[]
  currentIndex: number
  ratings: RatingValue[]
  reviewedCards: ReviewedCard[]
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
    reviewedCards: [],
    newCardsCount: 0,
    sessionStartTime: 0,
    summary: null,
  })

  const cardStartTimeRef = useRef<number>(0)

  const startSession = useCallback(async () => {
    const settings = loadSettings()
    const queueStatus = await buildReviewQueue(kanjiData, settings.dailyNewCards)

    if (queueStatus.items.length === 0) {
      setState(prev => ({ ...prev, phase: 'idle', summary: null }))
      return
    }

    const newCount = queueStatus.items.filter(item => !item.cardState.introduced).length

    setState({
      phase: 'reviewing',
      queue: queueStatus.items,
      currentIndex: 0,
      ratings: [],
      reviewedCards: [],
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
      const totalTimeMs = Date.now() - state.sessionStartTime
      const summary = computeSessionSummary(newRatings, newReviewedCards, state.newCardsCount, totalTimeMs)
      window.dispatchEvent(new Event('kanji-review-complete'))
      checkMilestones(kanjiData).then(events => {
        for (const event of events) {
          showToast({ title: event.title, body: event.body, icon: event.icon })
        }
      })
      setState(prev => ({
        ...prev,
        phase: 'summary',
        ratings: newRatings,
        reviewedCards: newReviewedCards,
        summary,
      }))
    } else {
      setState(prev => ({
        ...prev,
        currentIndex: nextIndex,
        ratings: newRatings,
        reviewedCards: newReviewedCards,
      }))
      cardStartTimeRef.current = Date.now()
    }
  }, [state, mode, kanjiData])

  const endSession = useCallback(() => {
    setState({
      phase: 'idle',
      queue: [],
      currentIndex: 0,
      ratings: [],
      reviewedCards: [],
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
