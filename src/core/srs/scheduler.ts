import {
  createEmptyCard,
  fsrs,
  Rating,
  type Card,
  type FSRS,
  type RecordLogItem,
  type Grade,
  type IPreview,
} from 'ts-fsrs'
import type { AppSettings, CardState, RatingValue } from './types'
import { DEFAULT_SETTINGS } from './types'

function createScheduler(settings: Partial<AppSettings> = {}): FSRS {
  const merged = { ...DEFAULT_SETTINGS, ...settings }
  return fsrs({
    request_retention: merged.requestRetention,
    maximum_interval: merged.maximumInterval,
    enable_fuzz: true,
    enable_short_term: true,
    learning_steps: ['1m', '10m'],
    relearning_steps: ['10m'],
  })
}

let scheduler: FSRS = createScheduler()

export function updateSchedulerSettings(settings: Partial<AppSettings>): void {
  scheduler = createScheduler(settings)
}

export function getScheduler(): FSRS {
  return scheduler
}

export function createNewCardState(kanjiLiteral: string): CardState {
  return {
    kanjiLiteral,
    fsrsCard: createEmptyCard(),
    lastReviewedAt: null,
    totalReviews: 0,
    correctReviews: 0,
    introduced: false,
    introducedAt: null,
  }
}

export function ratingFromValue(value: RatingValue): Rating {
  switch (value) {
    case 1: return Rating.Again
    case 2: return Rating.Hard
    case 3: return Rating.Good
    case 4: return Rating.Easy
  }
}

export function reviewCard(
  card: Card,
  ratingValue: RatingValue,
  now: Date = new Date(),
): RecordLogItem {
  const rating = ratingFromValue(ratingValue)
  return scheduler.next(card, now, rating as unknown as Grade)
}

export function previewCard(
  card: Card,
  now: Date = new Date(),
): IPreview {
  return scheduler.repeat(card, now)
}

export function getRetrievability(card: Card, now: Date = new Date()): number {
  return scheduler.get_retrievability(card, now, false)
}

export function isDue(card: Card, now: Date = new Date()): boolean {
  return card.due <= now
}

export function isNewCard(cardState: CardState): boolean {
  return !cardState.introduced
}
