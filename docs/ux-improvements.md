# Phase 5: UX Improvements — Detailed Spec

> **Status**: Planned  
> **Ref**: PLAN.md items #25–#34  
> **Last updated**: 2026-04-06

---

## Table of Contents

- [5A-1: Smart Empty-State Messaging](#5a-1-smart-empty-state-messaging)
- [5A-2: Header Status Bar](#5a-2-header-status-bar)
- [5A-3: Session Summary — Missed Cards](#5a-3-session-summary--missed-cards)
- [5B-1: Post-Session Actions](#5b-1-post-session-actions)
- [5B-2: Next Review Countdown](#5b-2-next-review-countdown)
- [5B-3: Milestone Toasts](#5b-3-milestone-toasts)
- [5B-4: Browse — SRS Status Badges](#5b-4-browse--srs-status-badges)
- [5C-1: Daily Review Forecast](#5c-1-daily-review-forecast)
- [5C-2: Heatmap Hover Tooltips](#5c-2-heatmap-hover-tooltips)
- [5C-3: Grade Progress in Study Dropdown](#5c-3-grade-progress-in-study-dropdown)

---

## 5A-1: Smart Empty-State Messaging

**Problem**: When no cards are available, the idle screen shows a generic "Start a review session to practice your kanji" message. Users don't understand *why* they can't study or *when* they can return.

**PLAN.md ref**: Item #25

### Root Cause Analysis

`buildReviewQueue()` in `src/core/srs/session.ts` returns an empty `ReviewItem[]` without explaining the reason. The empty queue has three distinct causes:

| Cause | Condition | User Message |
|-------|-----------|--------------|
| **Daily limit reached** | `newCardsToday >= dailyNewLimit` AND no due cards | "All caught up! You've studied {n}/{limit} new cards today." |
| **Cards scheduled for later** | All introduced cards have `due > now` | "Next review due {relative time}. Come back then!" |
| **First time / no cards** | No cards introduced yet, limit = 0, or data not loaded | "Welcome! Tap Start Review to begin learning kanji." |
| **All kanji mastered** | All 2,136 introduced AND none due | "Amazing — all kanji reviewed! Next due {time}." |

### Changes Required

#### 1. New type: `QueueStatus`

**File**: `src/core/srs/types.ts`

```typescript
export interface QueueStatus {
  items: ReviewItem[]
  reason: 'has-cards' | 'daily-limit' | 'all-scheduled' | 'no-cards' | 'all-mastered'
  nextDueDate: Date | null        // Earliest due date across all cards
  newCardsToday: number           // How many new cards introduced today
  newCardsLimit: number           // Daily new card setting
  totalIntroduced: number         // Total cards the user has seen
  totalKanji: number              // Total available (2,136)
}
```

#### 2. Update `buildReviewQueue()`

**File**: `src/core/srs/session.ts`

Change return type from `Promise<ReviewItem[]>` to `Promise<QueueStatus>`.

After filtering due items and computing new card quota, determine the reason:
- If `items.length > 0` → `'has-cards'`
- Else if `totalIntroduced === 0` → `'no-cards'`
- Else if `newCardsToday >= dailyNewLimit` and due items exist in future → `'daily-limit'`
- Else if `totalIntroduced === totalKanji` → `'all-mastered'`
- Else → `'all-scheduled'`

Compute `nextDueDate` by scanning all card states for the minimum `fsrsCard.due` value that is in the future.

#### 3. Update `useReviewSession` hook

**File**: `src/hooks/useReviewSession.ts`

- Store `queueStatus: QueueStatus | null` in state alongside `phase`
- On `startSession()`, capture the full `QueueStatus` regardless of whether items are empty
- Expose `queueStatus` in hook return value

#### 4. Update `ReviewSession` idle render

**File**: `src/components/review/ReviewSession.tsx`

Replace the static empty state with a dynamic component:

```tsx
// When phase === 'idle' and queueStatus is available
<EmptyState status={queueStatus} />
```

#### 5. New component: `EmptyState`

**File**: `src/components/review/EmptyState.tsx`  
**Styles**: `src/components/review/EmptyState.module.css`

Renders based on `queueStatus.reason`:

| Reason | Icon | Heading | Body | Action |
|--------|------|---------|------|--------|
| `no-cards` | 📚 | Welcome! | Start your kanji journey. | "Begin Learning" button |
| `daily-limit` | ✅ | All caught up! | {n}/{limit} new cards studied today. Next review {relative time}. | "Change daily limit" link → Settings |
| `all-scheduled` | ⏳ | Next review in {countdown} | All cards are scheduled. Check back soon. | — |
| `all-mastered` | 🎉 | Incredible! | All 2,136 kanji reviewed. Next due {time}. | — |

The `{relative time}` / `{countdown}` displays a human-readable duration (e.g., "3h 20m", "tomorrow at 9am").

#### Utility function: `formatRelativeTime(date: Date): string`

**File**: `src/utils/time.ts`

```
< 1 minute  → "less than a minute"
< 60 min    → "Xm"
< 24 hours  → "Xh Ym"
< 7 days    → "X days"
else        → "Mon DD" (date format)
```

### Test Cases

- Empty queue with `reason: 'daily-limit'` renders limit message
- Empty queue with `reason: 'all-scheduled'` shows countdown
- Countdown updates or shows correct relative time
- `formatRelativeTime` handles edge cases (past dates, null)
- First-time user sees welcome message

---

## 5A-2: Header Status Bar

**Problem**: Users have no persistent visibility into their SRS status. They must navigate to the Progress page to see any stats.

**PLAN.md ref**: Item #26

### Design

Add a thin stats strip below the existing header navigation. Always visible.

```
┌──────────────────────────────────────────────┐
│  漢 Kanji Renshū  │ Study ▾ │ Browse │ ...  │
├──────────────────────────────────────────────┤
│  📋 12 due  ·  🆕 7/10 new today  ·  🔥 5d  │
└──────────────────────────────────────────────┘
```

Three stats, separated by `·` dividers:

| Stat | Source | Format | Updates |
|------|--------|--------|---------|
| **Due** | Count of cards where `fsrsCard.due <= now` | `{n} due` (orange if > 0, muted if 0) | After each review, on page focus |
| **New today** | `newCardsToday / dailyNewLimit` | `{n}/{limit} new today` | After each review |
| **Streak** | Current consecutive days with ≥1 review | `{n}d streak` (🔥 icon if active today) | On load |

### Changes Required

#### 1. New hook: `useQueueStats`

**File**: `src/hooks/useQueueStats.ts`

```typescript
interface QueueStats {
  dueCount: number
  newToday: number
  newLimit: number
  currentStreak: number
  activatedToday: boolean  // Has user reviewed today?
}

function useQueueStats(): QueueStats
```

Fetches all card states + today's daily stats on mount and after each review. Computes:
- `dueCount`: iterate cards, count where `due <= now`
- `newToday`: from today's `DailyStats.newCardsIntroduced`
- `newLimit`: from settings `dailyNewCards`
- `currentStreak`: from `getAllDailyStats()`, count consecutive days
- `activatedToday`: `DailyStats` exists for today with `reviewsCompleted > 0`

Should re-query on a `visibilitychange` event (user comes back to tab) and expose a `refresh()` method for post-review updates.

#### 2. New component: `StatusBar`

**File**: `src/components/layout/StatusBar.tsx`  
**Styles**: `src/components/layout/StatusBar.module.css`

Compact single-row bar. CSS:
- Background: `var(--color-surface)` with subtle top border
- Text: `var(--color-text-secondary)`, small font (0.8rem)
- Stat values: `var(--color-text-primary)`, semi-bold
- Due count: `var(--color-warning)` when > 0
- Streak: `var(--color-success)` with 🔥 when active today
- Responsive: on very narrow screens (< 400px), abbreviate to icons only

#### 3. Wire into `Header.tsx`

**File**: `src/components/layout/Header.tsx`

Render `<StatusBar />` below the existing nav bar.

### Test Cases

- Renders due count matching actual card states
- Due count updates after completing a review
- Streak shows 🔥 only when user has reviewed today
- New today fraction is correct (e.g., "0/10" before any reviews)
- Handles zero state gracefully (new user: "0 due · 0/10 new · 0d")

---

## 5A-3: Session Summary — Missed Cards

**Problem**: After a session, the summary shows aggregate rating counts but not *which* specific kanji the user struggled with. Users can't identify what to focus on.

**PLAN.md ref**: Item #27

### Design

Add a collapsible "Struggled Cards" section below the rating breakdown in `SessionSummary`. Shows only cards rated Again (1) or Hard (2).

```
┌─────────────────────────────────┐
│  Session Complete               │
│  Accuracy: 80%   Cards: 10     │
│  Again: 1  Hard: 1  Good: 6  … │
│                                 │
│  ▸ Struggled Cards (2)         │  ← collapsed by default
│  ┌─────────────────────────────┐│
│  │ 漢  カン  Sino-, China      ││
│  │ 字  ジ   Character, letter  ││
│  └─────────────────────────────┘│
│                                 │
│       [ Done ]                  │
└─────────────────────────────────┘
```

### Changes Required

#### 1. Extend `SessionSummaryData`

**File**: `src/core/srs/types.ts`

```typescript
export interface ReviewedCard {
  kanjiLiteral: string
  rating: RatingValue
  meanings: string[]
  readings: { onYomi: string[]; kunYomi: string[] }
}

export interface SessionSummaryData {
  // ... existing fields ...
  reviewedCards: ReviewedCard[]  // NEW: full card list with ratings
}
```

#### 2. Update `computeSessionSummary()`

**File**: `src/core/srs/session.ts`

Collect individual card ratings during the session and include them in the summary. The `processReview()` calls already have the kanji + rating — accumulate them into a list.

#### 3. Update `useReviewSession` hook

**File**: `src/hooks/useReviewSession.ts`

Track reviewed cards as a local array. On each `rateCard()`, push `{ kanjiLiteral, rating, meanings, readings }`. Pass the array to `computeSessionSummary()`.

#### 4. Update `SessionSummary` component

**File**: `src/components/review/SessionSummary.tsx`

Add a collapsible section below existing stats:
- Header: "Struggled Cards ({n})" — clickable toggle
- Hidden by default; expand on click
- Each row: kanji literal (large) + first on'yomi reading + first meaning
- Only shows cards with `rating <= 2` (Again or Hard)
- If no struggled cards: show "Perfect session! 🎯" instead

### Test Cases

- Summary includes `reviewedCards` array with correct ratings
- Collapsible section shows only Again/Hard cards
- Section hidden by default, toggles on click
- "Perfect session" message when all cards rated Good/Easy
- Empty session (0 cards) doesn't crash

---

## 5B-1: Post-Session Actions

**Problem**: After completing a session, the only option is "Done" which returns to the idle screen. If the user struggled with cards or wants to continue, there's no path forward.

**PLAN.md ref**: Item #28

### Design

Replace the single "Done" button with up to three action buttons:

| Button | Condition | Action |
|--------|-----------|--------|
| **Review struggled cards** | `againCount + hardCount > 0` | Start a new mini-session with only Again/Hard cards |
| **Start new session** | Queue has more cards available | Start a fresh `buildReviewQueue()` session |
| **Done** | Always | Return to idle |

### Changes Required

#### 1. Update `SessionSummary` props

**File**: `src/components/review/SessionSummary.tsx`

```typescript
interface SessionSummaryProps {
  summary: SessionSummaryData
  onDone: () => void
  onRetryStruggled: (() => void) | null   // null if no struggled cards
  onNewSession: (() => void) | null       // null if queue is empty
}
```

#### 2. Update `useReviewSession` hook

**File**: `src/hooks/useReviewSession.ts`

Add two new methods:
- `retryStruggled()`: Build a review queue from only the Again/Hard cards from the last session. Set phase back to `'reviewing'`.
- `startNewSession()`: Call `buildReviewQueue()` again. If items exist, start reviewing.

Expose both in hook return, returning `null` when not applicable.

#### 3. Update `ReviewSession` summary render

Pass the new callbacks to `SessionSummary`.

### Test Cases

- "Review struggled cards" button appears only when Again/Hard > 0
- "Start new session" button appears only when queue has items
- Retry session contains exactly the struggled cards
- After retry session, a new summary is shown

---

## 5B-2: Next Review Countdown

**Problem**: When no cards are due, users don't know when to come back. The app gives no temporal guidance.

**PLAN.md ref**: Item #29

### Design

On the idle screen (when no cards are due), show a live countdown that ticks every minute:

```
⏳ Next review in 2h 14m
```

Uses `QueueStatus.nextDueDate` from feature 5A-1. If `nextDueDate` is null (no cards introduced), don't show.

### Changes Required

#### 1. New hook: `useCountdown`

**File**: `src/hooks/useCountdown.ts`

```typescript
function useCountdown(targetDate: Date | null): string | null
```

Returns a formatted countdown string, updating every 60 seconds via `setInterval`. Returns `null` if `targetDate` is null or in the past.

#### 2. Integrate into `EmptyState` component

**File**: `src/components/review/EmptyState.tsx` (from 5A-1)

Use `useCountdown(queueStatus.nextDueDate)` and display the result below the heading.

### Test Cases

- Countdown displays correct relative time
- Updates on interval (mock timers)
- Returns null for past dates
- Cleans up interval on unmount

---

## 5B-3: Milestone Toasts

**Problem**: Users get no positive reinforcement for achievements. Learning 2,136 kanji is a long journey — celebrating milestones maintains motivation.

**PLAN.md ref**: Item #30

### Milestones

| Trigger | Message |
|---------|---------|
| 10 kanji introduced | "First 10 kanji! You're on your way." |
| 50 kanji introduced | "50 kanji learned!" |
| 100, 200, 500, 1000, 2136 | "{n} kanji learned! {encouraging message}" |
| Grade 1–6 complete | "Grade {n} complete — {count} kanji mastered!" |
| 7-day streak | "7-day streak! Consistency is key." |
| 30-day streak | "30-day streak — incredible dedication!" |
| 100-day streak | "100 days! You're unstoppable." |
| 365-day streak | "One full year of daily practice!" |

### Changes Required

#### 1. New component: `Toast`

**File**: `src/components/ui/Toast.tsx`  
**Styles**: `src/components/ui/Toast.module.css`

Slide-in notification at bottom-right. Auto-dismisses after 5 seconds. Shows:
- 🎉 icon (or milestone-specific)
- Title + body text
- Close button (×)

CSS animation: slide up from bottom, fade out on dismiss.

#### 2. New hook: `useToast`

**File**: `src/hooks/useToast.ts`

Simple toast queue manager:
```typescript
interface Toast { id: string; title: string; body: string; icon?: string }
function useToast(): {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
}
```

#### 3. Milestone detection

**File**: `src/core/srs/milestones.ts`

```typescript
interface MilestoneCheck {
  totalIntroduced: number
  currentStreak: number
  gradeCompletion: Map<number, { introduced: number; total: number }>
}

function checkMilestones(
  prev: MilestoneCheck,
  current: MilestoneCheck
): MilestoneEvent[]
```

Compares before/after state. Returns newly crossed milestones. Milestones are stored in localStorage to avoid re-triggering.

#### 4. Wire into review flow

After `processReview()` completes, check milestones and fire toasts.

### Test Cases

- Toast renders and auto-dismisses after timeout
- Milestone fires exactly once (not on reload)
- Grade completion milestone triggers at correct count
- Multiple milestones in one session show sequentially

---

## 5B-4: Browse — SRS Status Badges

**Problem**: The browse grid shows kanji tiles with no indication of learning progress. Users can't tell which kanji they've studied, which are overdue, or which are new.

**PLAN.md ref**: Item #31

### Design

Add a small colored dot (8px circle) in the top-right corner of each kanji tile:

| Status | Color | Condition |
|--------|-------|-----------|
| New | `var(--color-text-secondary)` (gray) | `introduced === false` |
| Learning | `var(--color-warning)` (amber) | `introduced && stability < 21 days` |
| Mature | `var(--color-success)` (green) | `introduced && stability >= 21 days` |
| Overdue | `var(--color-error)` (red) | `introduced && due < now` |

Overdue takes priority over Learning/Mature.

### Changes Required

#### 1. Compute card status map

**File**: `src/hooks/useCardStatus.ts`

```typescript
type CardSrsStatus = 'new' | 'learning' | 'mature' | 'overdue'

function useCardStatus(): Map<string, CardSrsStatus>
```

Fetches all card states on mount (reuses `getAllCardStates()`). Computes status per card.

#### 2. Update `KanjiGrid` tile rendering

**File**: `src/components/browse/KanjiGrid.tsx`

Add a `<span className={styles.statusDot} data-status={status} />` inside each tile. CSS uses `data-status` attribute for color.

#### 3. Optional: filter by status

The existing `FilterBar` already has "New / Learning / Review" chips. Wire them to use the same status computation for consistency.

### Test Cases

- New cards show gray dot
- Overdue cards show red dot (overdue takes priority)
- Status map recalculates when cards are reviewed
- Status dots are small and don't interfere with kanji readability

---

## 5C-1: Daily Review Forecast

**Problem**: Users can't anticipate future workload. Knowing "25 reviews tomorrow" helps plan study time.

**PLAN.md ref**: Item #32

### Design

A small section on the Progress page, below "Today's Stats":

```
📅 Upcoming Reviews
Tomorrow:  ████████ 18
Tue:       ████ 8
Wed:       ████████████ 25
Thu:       ██████ 12
Fri:       ██ 4
Sat:       ███ 6
Sun:       █████ 10
```

Simple horizontal bar chart, 7 days.

### Changes Required

#### 1. New utility: `computeForecast`

**File**: `src/core/srs/forecast.ts`

```typescript
interface ForecastDay {
  date: string      // YYYY-MM-DD
  label: string     // "Tomorrow", "Tue", etc.
  dueCount: number
}

function computeForecast(cards: CardState[], days: number): ForecastDay[]
```

For each introduced card, check if `fsrsCard.due` falls within each of the next N days. Count per bucket.

#### 2. New component: `ReviewForecast`

**File**: `src/components/progress/ReviewForecast.tsx`  
**Styles**: `src/components/progress/ReviewForecast.module.css`

Renders the 7-day bar chart. Each bar width is proportional to the max day count. Shows count label at end of bar.

#### 3. Wire into `Dashboard`

**File**: `src/components/progress/Dashboard.tsx`

Add `<ReviewForecast />` section between Today's stats and the Activity heatmap.

### Test Cases

- Forecast shows 7 days starting from tomorrow
- Day with 0 reviews shows minimal bar
- Labels show correct day names
- Cards due today are NOT included (they're in "Today" section)

---

## 5C-2: Heatmap Hover Tooltips

**Problem**: The activity heatmap shows color-coded tiles but no detail on hover. Users can't see specific stats for a given day.

**PLAN.md ref**: Item #33

### Design

On hover (desktop) or tap (mobile), show a tooltip above the heatmap cell:

```
Mar 15, 2026
23 reviews · 85% accuracy
```

### Changes Required

#### 1. New component: `Tooltip`

**File**: `src/components/ui/Tooltip.tsx`  
**Styles**: `src/components/ui/Tooltip.module.css`

Generic tooltip positioned relative to its anchor element. Uses CSS `position: absolute` with smart edge detection. Shows on hover/focus.

#### 2. Update heatmap cell rendering

**File**: `src/components/progress/StreakCalendar.tsx`

Wrap each day cell with tooltip data. On hover, show formatted date + review count + accuracy.

### Data Source

`getAllDailyStats()` already returns per-day stats with `reviewsCompleted` and `correctCount`. Accuracy = `correctCount / reviewsCompleted * 100`.

### Test Cases

- Tooltip appears on hover
- Tooltip shows correct date and stats
- Days with 0 reviews show "No reviews"
- Tooltip doesn't overflow viewport

---

## 5C-3: Grade Progress in Study Dropdown

**Problem**: The Study dropdown just lists quiz modes. Adding progress fractions gives users a quick sense of where they are.

**PLAN.md ref**: Item #34

### Design

```
Study ▾
┌──────────────────────────────┐
│ Recognition    42/80  G1     │
│ Meaning Quiz   42/80  G1     │
│ Reading Quiz   42/80  G1     │
│ Writing        42/80  G1     │
└──────────────────────────────┘
```

Actually — the progress is per-grade, not per-mode. A simpler approach: show the user's current active grade (lowest incomplete) and its progress.

### Changes Required

#### 1. Compute active grade

**File**: `src/hooks/useActiveGrade.ts`

```typescript
interface ActiveGrade {
  grade: number
  introduced: number
  total: number
}

function useActiveGrade(): ActiveGrade | null
```

Returns the lowest grade where `introduced < total`. Returns null if all complete.

#### 2. Update Header dropdown

**File**: `src/components/layout/Header.tsx`

Show a small progress indicator below the Study dropdown title:
```
Study ▾  Grade 1: 42/80
```

Compact, doesn't clutter the nav.

### Test Cases

- Shows lowest incomplete grade
- Shows null/nothing when all grades complete
- Updates after reviewing new cards

---

## Implementation Order

Recommended build order based on dependencies and impact:

```
5A-1  Smart empty states ─────────┐
5B-2  Next review countdown ──────┤ (depends on QueueStatus from 5A-1)
5B-1  Post-session actions ────────┤
5A-3  Missed cards in summary ─────┘

5A-2  Header status bar ──────────── (independent)

5B-4  Browse status badges ────────── (independent)

5B-3  Milestone toasts ────────────── (independent, needs Toast component)
5C-2  Heatmap tooltips ────────────── (independent, needs Tooltip component)

5C-1  Review forecast ─────────────── (independent)
5C-3  Dropdown progress ───────────── (independent)
```

Start with **5A-1** (Smart empty states) as it creates the `QueueStatus` type that 5B-2 and 5B-1 depend on. Then **5A-2** (Header status bar) for immediate user value. Both directly address the "can't study again" confusion.

---

## Files Created/Modified Summary

### New Files
| File | Feature |
|------|---------|
| `src/core/srs/types.ts` | `QueueStatus`, `ReviewedCard` types (5A-1, 5A-3) |
| `src/core/srs/forecast.ts` | Review forecast computation (5C-1) |
| `src/core/srs/milestones.ts` | Milestone detection (5B-3) |
| `src/utils/time.ts` | `formatRelativeTime()` (5A-1, 5B-2) |
| `src/hooks/useQueueStats.ts` | Header status bar data (5A-2) |
| `src/hooks/useCountdown.ts` | Live countdown (5B-2) |
| `src/hooks/useToast.ts` | Toast queue manager (5B-3) |
| `src/hooks/useCardStatus.ts` | Per-card SRS status (5B-4) |
| `src/hooks/useActiveGrade.ts` | Current grade progress (5C-3) |
| `src/components/review/EmptyState.tsx` | Context-aware idle screen (5A-1) |
| `src/components/layout/StatusBar.tsx` | Persistent stats strip (5A-2) |
| `src/components/ui/Toast.tsx` | Toast notification (5B-3) |
| `src/components/ui/Tooltip.tsx` | Hover tooltip (5C-2) |
| `src/components/progress/ReviewForecast.tsx` | 7-day forecast chart (5C-1) |

### Modified Files
| File | Feature |
|------|---------|
| `src/core/srs/session.ts` | Return `QueueStatus`, collect per-card results (5A-1, 5A-3) |
| `src/hooks/useReviewSession.ts` | Expose `QueueStatus`, retry/new session methods (5A-1, 5B-1) |
| `src/components/review/ReviewSession.tsx` | Use `EmptyState`, pass new props (5A-1, 5B-1) |
| `src/components/review/SessionSummary.tsx` | Missed cards section, action buttons (5A-3, 5B-1) |
| `src/components/layout/Header.tsx` | Add `StatusBar`, dropdown progress (5A-2, 5C-3) |
| `src/components/browse/KanjiGrid.tsx` | Status dot badges (5B-4) |
| `src/components/progress/Dashboard.tsx` | Add forecast section (5C-1) |
| `src/components/progress/StreakCalendar.tsx` | Tooltip on hover (5C-2) |
