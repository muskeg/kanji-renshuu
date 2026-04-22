import type { Card, ReviewLog as FSRSReviewLog } from 'ts-fsrs'

/** Kanji entry as loaded from pre-built JSON data */
export interface KanjiEntry {
  literal: string
  grade: number
  jlpt: number | null
  /** Modern JLPT level (5=N5 easiest .. 1=N1 hardest). Derived at build time. */
  jlptN: 1 | 2 | 3 | 4 | 5 | null
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
export type QuizMode = 'recognition' | 'meaning' | 'reading' | 'writing' | 'cloze'

/** Compact vocabulary example from JMdict for a single kanji. */
export interface VocabExample {
  /** Word in kanji form, e.g. "本日". */
  w: string
  /** Reading in kana, e.g. "ほんじつ". */
  r: string
  /** English gloss(es) joined with "; ". */
  m: string
  /** 1 when JMdict marks this entry as common. */
  c?: 1
}

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
  /** ISO date (YYYY-MM-DD) derived from `timestamp`, indexed for fast daily lookups. */
  date: string
  responseTimeMs: number
  fsrsLog: FSRSReviewLog
  /** Snapshot of the CardState *before* this review was applied (D.5 undo). */
  previousCardState?: CardState
  /** XP awarded by this review (D.5 undo will subtract). */
  xpAwarded?: number
  /** Whether this review introduced the kanji for the first time. */
  introducedHere?: boolean
}

/** Aggregated daily statistics */
export interface DailyStats {
  date: string
  newCardsIntroduced: number
  reviewsCompleted: number
  correctCount: number
  totalTimeMs: number
}

/** Persistent gamification stats — single record keyed by `'singleton'`. */
export interface UserStats {
  id: 'singleton'
  /** Total XP earned across the lifetime of the account. */
  lifetimeXp: number
  /** Available streak-freeze tokens (consumed on missed days). */
  freezes: number
  /** Last update timestamp (ms since epoch). */
  updatedAt: number
}

/** Filter spec shared by browse view and decks. */
export interface DeckFilter {
  grades: number[]
  jlptLevels: number[]
  /** When non-empty, restrict to these literals (overrides other filters). */
  literals?: string[]
}

/** A user-defined collection of kanji used as an alternate review queue source. */
export interface Deck {
  id: string
  name: string
  /** CSS color string for visual chip; falls back to default theme color. */
  color: string
  filter: DeckFilter
  /** Created-at timestamp (ms). */
  createdAt: number
  /** Last-modified timestamp (ms). */
  updatedAt: number
}

/** User-editable mnemonic / note attached to a kanji (E.5). */
export interface KanjiNote {
  kanjiLiteral: string
  /** Markdown source (subset). Sanitized at render time. */
  content: string
  updatedAt: number
}

/** User-configurable settings */
export type LearningPath = 'byGrade' | 'byJlpt' | 'byFrequency' | 'radicalFirst' | 'byStrokeCount'

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
  ttsEnabled: boolean
  learningPath: LearningPath
  /** Per-grade caps on new-card introductions per day (D.5). Empty/missing = no cap. */
  perGradeNewCaps?: Record<number, number>
  /** When true, SRS scheduling is paused — no new cards introduced and reviews don't progress. (D.5) */
  pauseSrs: boolean
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
  ttsEnabled: false,
  learningPath: 'byGrade',
  pauseSrs: false,
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
