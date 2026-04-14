import type { Card, ReviewLog as FSRSReviewLog } from 'ts-fsrs'

/** Kanji entry as loaded from pre-built JSON data */
export interface KanjiEntry {
  literal: string
  grade: number
  jlpt: number | null
  strokeCount: number
  frequency: number | null
  radical: number
  readings: {
    onYomi: string[]
    kunYomi: string[]
    nanori: string[]
  }
  meanings: string[]
  meaningsFr: string[]
  strokeOrderSvg: string
  components: string[]
}

/** Quiz modes supported by the app */
export type QuizMode = 'recognition' | 'meaning' | 'reading' | 'writing'

/** Rating values matching ts-fsrs Rating enum (1-4) */
export type RatingValue = 1 | 2 | 3 | 4

/** SRS card state stored in IndexedDB */
export interface CardState {
  kanjiLiteral: string
  fsrsCard: Card
  lastReviewedAt: number | null
  totalReviews: number
  correctReviews: number
  introduced: boolean
  introducedAt: number | null
}

/** Review log entry stored in IndexedDB */
export interface ReviewLogEntry {
  id: string
  kanjiLiteral: string
  rating: RatingValue
  mode: QuizMode
  timestamp: number
  responseTimeMs: number
  fsrsLog: FSRSReviewLog
}

/** Aggregated daily statistics */
export interface DailyStats {
  date: string
  newCardsIntroduced: number
  reviewsCompleted: number
  correctCount: number
  totalTimeMs: number
}

/** User-configurable settings */
export interface AppSettings {
  dailyNewCards: number
  dailyReviewLimit: number
  requestRetention: number
  maximumInterval: number
  defaultQuizMode: QuizMode
  showReadingsOnFront: boolean
  theme: 'dark' | 'light' | 'system'
  soundEnabled: boolean
  language: 'en' | 'fr'
  uiScale: number
  guidedWriting: boolean
}

/** Default settings */
export const DEFAULT_SETTINGS: AppSettings = {
  dailyNewCards: 10,
  dailyReviewLimit: 0, // 0 = unlimited
  requestRetention: 0.9,
  maximumInterval: 365,
  defaultQuizMode: 'recognition',
  showReadingsOnFront: false,
  theme: 'system',
  soundEnabled: false,
  language: 'en',
  uiScale: 100,
  guidedWriting: true,
}

/** Review session state */
export type SessionPhase = 'idle' | 'reviewing' | 'summary'

/** A card queued for review with its kanji data */
export interface ReviewItem {
  cardState: CardState
  kanji: KanjiEntry
}

/** Queue build result with context about why the queue may be empty */
export interface QueueStatus {
  items: ReviewItem[]
  reason: 'has-cards' | 'daily-limit' | 'all-scheduled' | 'no-cards' | 'all-mastered'
  nextDueDate: Date | null
  newCardsToday: number
  newCardsLimit: number
  totalIntroduced: number
  totalKanji: number
}

/** A reviewed card with its rating for post-session display */
export interface ReviewedCard {
  kanjiLiteral: string
  rating: RatingValue
  meanings: string[]
  readings: { onYomi: string[]; kunYomi: string[] }
}

/** Session summary after review completion */
export interface SessionSummaryData {
  totalReviewed: number
  correctCount: number
  againCount: number
  hardCount: number
  goodCount: number
  easyCount: number
  newCardsIntroduced: number
  totalTimeMs: number
  reviewedCards: ReviewedCard[]
}
