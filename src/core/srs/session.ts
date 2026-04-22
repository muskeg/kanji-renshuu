import type { Card } from 'ts-fsrs'
import type {
  CardState,
  ReviewItem,
  ReviewLogEntry,
  ReviewedCard,
  RatingValue,
  SessionSummaryData,
  QueueStatus,
  KanjiEntry,
  DailyStats,
  QuizMode,
  DeckFilter,
  LearningPath,
} from './types'
import { createNewCardState, isDue, reviewCard } from './scheduler'
import { addXp, xpForReview } from '@/core/gamification/xp'
import {
  putCardState,
  addReviewLog,
  getIntroducedCards,
  getDailyStats,
  putDailyStats,
  todayDateString,
  generateId,
} from '@/core/storage/db'
import { applyDeckFilter } from '@/core/storage/decks'
import { sortByPath } from '@/core/learning/paths'
import { awardLessonBonusIfDue } from '@/core/learning/lessons'

/** Options passed to {@link buildReviewQueue}. */
export interface BuildQueueOptions {
  /** When set, restrict the queue to kanji matching this deck filter. */
  deckFilter?: DeckFilter
  /** Strategy for ordering new-card candidates. Defaults to `byGrade`. */
  learningPath?: LearningPath
  /** Per-grade daily caps on newly-introduced cards. Empty = no per-grade cap. */
  perGradeNewCaps?: Record<number, number>
  /** When true, do not introduce any new cards (reviews still surface). */
  pauseNewCards?: boolean
}

/** Build the review queue: due cards first, then new cards up to daily limit */
export async function buildReviewQueue(
  kanjiData: KanjiEntry[],
  dailyNewLimit: number,
  dailyReviewLimit: number = 0,
  options: BuildQueueOptions = {},
): Promise<QueueStatus> {
  const { deckFilter, learningPath = 'byGrade', perGradeNewCaps, pauseNewCards } = options
  // Restrict the kanji pool to the deck's filter when one is provided. This
  // affects both the candidate pool for new cards AND the introduced cards we
  // consider as "due", so deck-scoped sessions only surface deck-scoped kanji.
  const pool = deckFilter ? applyDeckFilter(kanjiData, deckFilter) : kanjiData
  const poolLiterals = deckFilter ? new Set(pool.map(k => k.literal)) : null
  const now = new Date()
  const today = todayDateString()
  const todayStats = await getDailyStats(today)
  const newCardsToday = todayStats?.newCardsIntroduced ?? 0
  const reviewsDoneToday = todayStats?.reviewsCompleted ?? 0

  const introduced = await getIntroducedCards()
  const allDueItems: ReviewItem[] = []

  // Track next due date across all introduced cards
  let nextDueDate: Date | null = null

  // Gather due reviews
  for (const cardState of introduced) {
    if (poolLiterals && !poolLiterals.has(cardState.kanjiLiteral)) continue
    if (isDue(cardState.fsrsCard, now)) {
      const kanji = pool.find(k => k.literal === cardState.kanjiLiteral)
      if (kanji) {
        allDueItems.push({ cardState, kanji })
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
  allDueItems.sort((a, b) => {
    const aTime = new Date(a.cardState.fsrsCard.due).getTime()
    const bTime = new Date(b.cardState.fsrsCard.due).getTime()
    return aTime - bTime
  })

  // Apply daily review limit (0 = unlimited)
  const reviewLimitReached = dailyReviewLimit > 0 && reviewsDoneToday >= dailyReviewLimit
  const remainingReviews = dailyReviewLimit > 0
    ? Math.max(0, dailyReviewLimit - reviewsDoneToday)
    : allDueItems.length
  const dueItems = reviewLimitReached ? [] : allDueItems.slice(0, remainingReviews)

  // Gather new cards
  const newItems: ReviewItem[] = []
  const remainingNew = pauseNewCards ? 0 : Math.max(0, dailyNewLimit - newCardsToday)

  if (remainingNew > 0) {
    const introducedSet = new Set(introduced.map(c => c.kanjiLiteral))

    // Per-grade caps: count today's introductions per grade so we can stop
    // adding new cards from a grade once its quota is reached.
    const perGradeUsed = new Map<number, number>()
    if (perGradeNewCaps) {
      const todayMs = Date.parse(today)
      for (const c of introduced) {
        if (c.introducedAt !== null && c.introducedAt >= todayMs) {
          const k = pool.find(p => p.literal === c.kanjiLiteral) ?? kanjiData.find(p => p.literal === c.kanjiLiteral)
          if (k) perGradeUsed.set(k.grade, (perGradeUsed.get(k.grade) ?? 0) + 1)
        }
      }
    }

    const candidates = sortByPath(
      pool.filter(k => !introducedSet.has(k.literal)),
      learningPath,
    )

    for (const kanji of candidates) {
      if (newItems.length >= remainingNew) break
      if (perGradeNewCaps) {
        const cap = perGradeNewCaps[kanji.grade]
        if (typeof cap === 'number' && cap >= 0) {
          const used = perGradeUsed.get(kanji.grade) ?? 0
          if (used >= cap) continue
          perGradeUsed.set(kanji.grade, used + 1)
        }
      }
      const cardState = createNewCardState(kanji.literal)
      newItems.push({ cardState, kanji })
    }
  }

  const items = [...dueItems, ...newItems]
  const totalIntroduced = introduced.length
  const totalKanji = kanjiData.length
  let reason: QueueStatus['reason']
  if (items.length > 0) {
    reason = 'has-cards'
  } else if (totalIntroduced === 0) {
    reason = 'no-cards'
  } else if (totalIntroduced >= totalKanji && allDueItems.length === 0) {
    reason = 'all-mastered'
  } else if (
    (newCardsToday >= dailyNewLimit && allDueItems.length === 0) ||
    (reviewLimitReached && newCardsToday >= dailyNewLimit)
  ) {
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

/** Result of processing a single review — includes XP awarded for UI feedback. */
export interface ProcessReviewResult {
  cardState: CardState
  xpAwarded: number
  leveledUp: boolean
  previousLevel: number
  newLevel: number
}

/** Process a single review rating and update storage */
export async function processReview(
  item: ReviewItem,
  ratingValue: RatingValue,
  mode: QuizMode,
  responseTimeMs: number,
): Promise<ProcessReviewResult> {
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
  const today = todayDateString()
  const xpAwarded = xpForReview(ratingValue, isNew)
  const logEntry: ReviewLogEntry = {
    id: generateId(),
    kanjiLiteral: item.cardState.kanjiLiteral,
    rating: ratingValue,
    mode,
    timestamp: now.getTime(),
    date: today,
    responseTimeMs,
    fsrsLog: result.log,
    previousCardState: item.cardState,
    introducedHere: isNew,
    xpAwarded,
  }
  await addReviewLog(logEntry)

  // Update daily stats
  const existing = await getDailyStats(today)
  const stats: DailyStats = {
    date: today,
    newCardsIntroduced: (existing?.newCardsIntroduced ?? 0) + (isNew ? 1 : 0),
    reviewsCompleted: (existing?.reviewsCompleted ?? 0) + 1,
    correctCount: (existing?.correctCount ?? 0) + (isCorrect ? 1 : 0),
    totalTimeMs: (existing?.totalTimeMs ?? 0) + responseTimeMs,
  }
  await putDailyStats(stats)

  // Award XP (xpAwarded already computed above for the log entry)
  const xpResult = await addXp(xpAwarded)

  // D.4: Lesson checkpoint — every Nth newly-introduced kanji awards a bonus.
  if (isNew) {
    const totalIntroducedAfter = (await getIntroducedCards()).length
    await awardLessonBonusIfDue(totalIntroducedAfter)
  }

  return {
    cardState: updatedState,
    xpAwarded,
    leveledUp: xpResult.leveledUp,
    previousLevel: xpResult.previousLevel,
    newLevel: xpResult.newLevel,
  }
}

/** Compute summary from a completed session of ratings */
export function computeSessionSummary(
  ratings: RatingValue[],
  reviewedCards: ReviewedCard[],
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
    reviewedCards,
  }
}
