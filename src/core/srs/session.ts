import type { Card } from 'ts-fsrs'
import type {
  CardState,
  ReviewItem,
  ReviewLogEntry,
  RatingValue,
  SessionSummaryData,
  QueueStatus,
  KanjiEntry,
  DailyStats,
  QuizMode,
} from './types'
import { createNewCardState, isDue, reviewCard } from './scheduler'
import {
  putCardState,
  addReviewLog,
  getIntroducedCards,
  getDailyStats,
  putDailyStats,
  todayDateString,
  generateId,
} from '@/core/storage/db'

/** Build the review queue: due cards first, then new cards up to daily limit */
export async function buildReviewQueue(
  kanjiData: KanjiEntry[],
  dailyNewLimit: number,
): Promise<QueueStatus> {
  const now = new Date()
  const today = todayDateString()
  const todayStats = await getDailyStats(today)
  const newCardsToday = todayStats?.newCardsIntroduced ?? 0

  const introduced = await getIntroducedCards()
  const dueItems: ReviewItem[] = []

  // Track next due date across all introduced cards
  let nextDueDate: Date | null = null

  // Gather due reviews
  for (const cardState of introduced) {
    if (isDue(cardState.fsrsCard, now)) {
      const kanji = kanjiData.find(k => k.literal === cardState.kanjiLiteral)
      if (kanji) {
        dueItems.push({ cardState, kanji })
      }
    } else {
      // Not due yet — track nearest future due date
      const due = new Date(cardState.fsrsCard.due)
      if (due > now && (!nextDueDate || due < nextDueDate)) {
        nextDueDate = due
      }
    }
  }

  // Sort due items: most overdue first
  dueItems.sort((a, b) => {
    const aTime = a.cardState.fsrsCard.due.getTime()
    const bTime = b.cardState.fsrsCard.due.getTime()
    return aTime - bTime
  })

  // Gather new cards
  const newItems: ReviewItem[] = []
  const remainingNew = Math.max(0, dailyNewLimit - newCardsToday)

  if (remainingNew > 0) {
    const introducedSet = new Set(introduced.map(c => c.kanjiLiteral))

    // Sort by grade then frequency for learning order
    const candidates = kanjiData
      .filter(k => !introducedSet.has(k.literal))
      .sort((a, b) => {
        if (a.grade !== b.grade) return a.grade - b.grade
        const aFreq = a.frequency ?? 9999
        const bFreq = b.frequency ?? 9999
        return aFreq - bFreq
      })

    for (const kanji of candidates.slice(0, remainingNew)) {
      const cardState = createNewCardState(kanji.literal)
      newItems.push({ cardState, kanji })
    }
  }

  const items = [...dueItems, ...newItems]
  const totalIntroduced = introduced.length
  const totalKanji = kanjiData.length

  // Determine reason for empty/non-empty queue
  let reason: QueueStatus['reason']
  if (items.length > 0) {
    reason = 'has-cards'
  } else if (totalIntroduced === 0) {
    reason = 'no-cards'
  } else if (totalIntroduced >= totalKanji && dueItems.length === 0) {
    reason = 'all-mastered'
  } else if (newCardsToday >= dailyNewLimit && dueItems.length === 0) {
    reason = 'daily-limit'
  } else {
    reason = 'all-scheduled'
  }

  return {
    items,
    reason,
    nextDueDate,
    newCardsToday,
    newCardsLimit: dailyNewLimit,
    totalIntroduced,
    totalKanji,
  }
}

/** Process a single review rating and update storage */
export async function processReview(
  item: ReviewItem,
  ratingValue: RatingValue,
  mode: QuizMode,
  responseTimeMs: number,
): Promise<CardState> {
  const now = new Date()
  const result = reviewCard(item.cardState.fsrsCard, ratingValue, now)

  // Deserialize dates from FSRS result (they may come as strings)
  const newCard: Card = {
    ...result.card,
    due: new Date(result.card.due),
    last_review: result.card.last_review ? new Date(result.card.last_review) : undefined,
  }

  const isCorrect = ratingValue >= 3
  const isNew = !item.cardState.introduced

  const updatedState: CardState = {
    ...item.cardState,
    fsrsCard: newCard,
    lastReviewedAt: now.getTime(),
    totalReviews: item.cardState.totalReviews + 1,
    correctReviews: item.cardState.correctReviews + (isCorrect ? 1 : 0),
    introduced: true,
    introducedAt: item.cardState.introducedAt ?? now.getTime(),
  }

  // Save card state
  await putCardState(updatedState)

  // Save review log
  const logEntry: ReviewLogEntry = {
    id: generateId(),
    kanjiLiteral: item.cardState.kanjiLiteral,
    rating: ratingValue,
    mode,
    timestamp: now.getTime(),
    responseTimeMs,
    fsrsLog: result.log,
  }
  await addReviewLog(logEntry)

  // Update daily stats
  const today = todayDateString()
  const existing = await getDailyStats(today)
  const stats: DailyStats = {
    date: today,
    newCardsIntroduced: (existing?.newCardsIntroduced ?? 0) + (isNew ? 1 : 0),
    reviewsCompleted: (existing?.reviewsCompleted ?? 0) + 1,
    correctCount: (existing?.correctCount ?? 0) + (isCorrect ? 1 : 0),
    totalTimeMs: (existing?.totalTimeMs ?? 0) + responseTimeMs,
  }
  await putDailyStats(stats)

  return updatedState
}

/** Compute summary from a completed session of ratings */
export function computeSessionSummary(
  ratings: RatingValue[],
  newCardsCount: number,
  totalTimeMs: number,
): SessionSummaryData {
  return {
    totalReviewed: ratings.length,
    correctCount: ratings.filter(r => r >= 3).length,
    againCount: ratings.filter(r => r === 1).length,
    hardCount: ratings.filter(r => r === 2).length,
    goodCount: ratings.filter(r => r === 3).length,
    easyCount: ratings.filter(r => r === 4).length,
    newCardsIntroduced: newCardsCount,
    totalTimeMs,
  }
}
