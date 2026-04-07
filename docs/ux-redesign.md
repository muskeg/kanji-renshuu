# Kanji Renshū — UX Redesign Plan

> Authored from a game-design perspective: every screen should answer "What do I do?", "Why should I care?", and "What did I earn?"

---

## Executive Summary

The app has solid mechanics (FSRS, four quiz modes, stroke order, progress tracking) but **buries them behind an opaque interface**. A first-time user lands on a screen that says "Welcome!" with a single button and zero explanation of what the app actually does, how it works, or what "Recognition" even means. Returning users face a nav bar where clicking quiz modes shows an idle screen with no feedback if the queue is empty. The entire experience lacks the **clarity, momentum, and reward loops** that keep people coming back.

This plan addresses three systemic problems:
1. **Discoverability** — Users don't know what's available or how to use it
2. **Feedback** — Actions often produce no visible response
3. **Motivation** — No narrative arc, no sense of progression between sessions

---

## Critical UX Problems (Audit Findings)

### P0 — Broken First Impressions

| # | Problem | Impact |
|---|---------|--------|
| 1 | **"Welcome!" says nothing.** First-time user sees `📚 Welcome! Start your kanji journey with your first review session. [Begin Learning]`. No explanation of what the app is, how SRS works, what "recognition" means, or that there are 4 study modes. | Users don't understand what they're signing up for. |
| 2 | **Nav buttons appear clickable but produce no feedback.** Clicking "Meaning Quiz" from the Study dropdown navigates to a page that shows `意 Meaning Quiz [Start Quiz]` — but if no cards are in the queue, clicking Start does nothing visible (the session starts and immediately returns to idle because `queueStatus.items.length === 0`). No error, no explanation. | Users think the app is broken. |
| 3 | **"Recognition" is jargon.** The default study mode is called "Recognition" — a term from SRS literature that means nothing to a casual learner. Other modes (Meaning Quiz, Reading Quiz, Writing Practice) are clearer but still lack context. | Users don't know which mode to pick or why. |
| 4 | **No explanation that modes share the same queue.** All four modes pull from the same FSRS queue. A user who completes Recognition and switches to Meaning Quiz expects new cards but gets an empty screen. | Confusing and feels broken. |

### P1 — Missing Guidance & Feedback

| # | Problem | Impact |
|---|---------|--------|
| 5 | **Quiz idle screens don't show queue status.** The Recognition mode has smart empty states (daily-limit, all-scheduled, etc.) but quiz modes just show a description + Start button. If the queue is empty, clicking Start silently fails. | Inconsistent behavior across modes. |
| 6 | **No explanation of the rating system.** First-time users see Again/Hard/Good/Easy buttons with interval previews like `<1m` and `2d`. No tooltip, no explanation. What does "Again" mean? When should I press "Hard" vs "Good"? | Users default to mashing "Good" or "Easy", undermining SRS. |
| 7 | **StatusBar uses emoji + abbreviations with no legend.** `📋 0 due · 🆕 0/10 new today · 🔥 0d streak` — what is "due"? What is "new today" vs regular review? What triggers the streak? | Information is there but not understood. |
| 8 | **Flashcard "Tap to reveal" is the only instruction ever shown.** There's no progressive disclosure: first card doesn't explain what to look for, how to self-assess, or where the answer will appear. | Users develop no mental model. |
| 9 | **Browse page has no call to action.** 2,136 kanji tiles with colored dots, but no explanation of what the dots mean, what clicking a tile does, or how to start studying a specific kanji. | A wall of data with no guidance. |
| 10 | **Settings are hidden and unexplained.** Critical settings like "Daily New Cards" and "Target Retention" are behind a ⚙ icon with no onboarding mention. The ⚙ icon itself has no label on mobile. | Users never customize, get stuck with defaults that may not suit them. |

### P2 — Missing Motivation & Progression

| # | Problem | Impact |
|---|---------|--------|
| 11 | **No narrative arc.** Learning 2,136 kanji is a multi-year journey. The app treats every session identically — there's no sense of chapters, stages, or a path. | No emotional investment, easy to quit. |
| 12 | **Grade progress is buried.** The only visible indicator is a tiny `G1: 0/80` next to the Study dropdown. The Progress page shows grade bars but they're below the fold, after Today's stats, Forecast, Streak, Overview, and Heatmap. | Users don't feel they're advancing through a curriculum. |
| 13 | **No "level up" moments beyond milestones.** Milestones fire toasts for 10/50/100 etc. kanji, but there's no visual progression — no unlocking of new content, no changing of the UI, no celebration page. | Milestones feel like notifications, not achievements. |
| 14 | **Daily goal is invisible.** The "new today" counter exists in the status bar but there's no daily goal framing ("Learn 10 new kanji today: ███░░░░ 3/10"), no completion celebration, no "come back tomorrow" moment. | Sessions end abruptly with no closure. |
| 15 | **Streak has no weight.** The streak is a number in the status bar and on the dashboard. There's no streak-freeze mechanic, no visual escalation (flames, colors), no consequence to breaking it. | No anxiety about maintaining it = no habit loop. |
| 16 | **Session summary is functional, not emotional.** "90% Accuracy, 20 cards, 3m 45s" is data. There's no XP, no score, no comparison to previous sessions, no "personal best" detection. | No dopamine hit, no desire to beat your own record. |

### P3 — Layout & Polish

| # | Problem | Impact |
|---|---------|--------|
| 17 | **Mobile nav is cramped.** Header tries to fit brand + 4 nav buttons + dropdown on one row. At 360px, text overflows or buttons become too small. Settings is just "⚙" with no label. | Miserable mobile experience. |
| 18 | **No page transitions.** Switching between views is an instant swap — no animation, no continuity. Feels like a prototype. | Cheap, unfinished feel. |
| 19 | **Card flip is not a flip.** The card simply fades in the back content. The `perspective: 1000px` CSS is set but never used for an actual 3D rotation. The component says "flip" but the UX is "reveal". | Disconnect between mental model and reality. |
| 20 | **No dark/light mode toggle.** The app is permanently dark. The `useTheme` hook is in the plan but never implemented. | Users in bright environments can't read the screen. |

---

## Improvement Plan

### Tier 1 — Fix the Broken (Ship This Week)

These fix real usability failures where users get confused or think the app is broken.

#### 1.1 Onboarding Flow (First Visit)

Replace the "Welcome!" empty state with a 3-step guided intro for first-time users (detected via `localStorage` flag):

**Step 1 — Welcome**
```
┌────────────────────────────────────────┐
│           漢字練習                      │
│        Kanji Renshū                    │
│                                        │
│  Master all 2,136 official Japanese    │
│  kanji with spaced repetition.         │
│                                        │
│  The app introduces new kanji daily    │
│  and schedules reviews at the optimal  │
│  time for long-term memory.            │
│                                        │
│         [Get Started →]                │
└────────────────────────────────────────┘
```

**Step 2 — Choose Your Pace**
```
┌────────────────────────────────────────┐
│      How many new kanji per day?       │
│                                        │
│   [ 5 ] Relaxed — 14 months           │
│   [10 ] Balanced — 7 months   ← rec.  │
│   [20 ] Intensive — 4 months           │
│                                        │
│  You can change this anytime in ⚙.     │
│                                        │
│          [Continue →]                  │
└────────────────────────────────────────┘
```

**Step 3 — How It Works**
```
┌────────────────────────────────────────┐
│         How studying works             │
│                                        │
│  1. See a kanji → recall its meaning   │
│  2. Tap to reveal the answer           │
│  3. Rate how well you remembered       │
│                                        │
│  The app schedules reviews so you      │
│  see harder kanji more often.          │
│                                        │
│  4 study modes:                        │
│  📖 Flashcards · 意 Meaning Quiz       │
│  読 Reading Quiz · 書 Writing Practice  │
│                                        │
│     [Start Your First Session →]       │
└────────────────────────────────────────┘
```

**Implementation:**
- New component: `src/components/onboarding/Onboarding.tsx`
- Flag: `localStorage.getItem('kanji-renshuu-onboarded')`
- Renders instead of `EmptyState` when flag is absent
- Step 2 writes daily new cards to settings
- Step 3 button calls `startSession()` and sets the flag

#### 1.2 Rename "Recognition" → "Flashcards"

Throughout the app, replace "Recognition" with "Flashcards" — a universally understood term.

- Header dropdown: `Recognition` → `Flashcards`
- Study mode references in code/UI
- Settings default quiz mode option

#### 1.3 Fix Silent Quiz-Start Failures

When any study mode's queue is empty, show the same smart empty states that the review/flashcard mode uses (daily-limit, all-scheduled, etc.) instead of silently returning to idle.

**Implementation:**
- Extract `EmptyState` to be reusable across all session components
- Add `queueStatus` to `useQuizSession` return value (it already calls `buildReviewQueue` internally)
- Show `EmptyState` in `MeaningQuizSession`, `ReadingQuizSession`, `WritingPracticeSession` when queue is empty

#### 1.4 Shared Queue Explanation

Add a subtle info line on all idle screens:

```
All study modes share the same review queue.
If you just completed a session, cards are scheduled for later.
```

Style as `color: var(--color-text-muted); font-size: var(--text-xs)`.

#### 1.5 First-Card Rating Tooltip

On the very first review ever (detected via `localStorage`), show a one-time tooltip overlay on the rating buttons:

```
┌──────────────────────────────────────┐
│  Rate how well you remembered:       │
│                                      │
│  Again — Didn't know it              │
│  Hard  — Barely recalled             │
│  Good  — Remembered after thinking   │
│  Easy  — Knew it instantly           │
│                                      │
│  The interval below each button      │
│  shows when you'll see this card     │
│  again.                              │
│                                      │
│        [Got it]                      │
└──────────────────────────────────────┘
```

---

### Tier 2 — Build the Loop (Ship This Month)

These create the habit loop that makes users return daily.

#### 2.1 Daily Goal Card

Replace the flat status bar with a prominent daily goal section on the main (flashcard/idle) screen:

```
┌────────────────────────────────────────┐
│  Today's Goal                          │
│  ████████░░░░░░ 6/10 new kanji         │
│  ██████████████ 15/15 reviews  ✅      │
│                                        │
│  🔥 7-day streak                       │
└────────────────────────────────────────┘
```

- Two separate progress bars: new cards + reviews
- Reviews bar shows "✅" when all due reviews are done
- Streak displayed prominently with escalating visual treatment:
  - Days 1–6: 🔥 + number
  - 7+: Double fire 🔥🔥
  - 30+: Special color (gold)
  - 100+: Crown 👑

#### 2.2 Session Scoring & Personal Bests

Add an XP-like scoring system to session summaries:

```
Session Score: 847 pts
━━━━━━━━━━━━━━━━━━━━━
Base:     20 cards × 10          200
Accuracy: 90% bonus              +180
Speed:    Under 5s avg           +100
Streak:   7-day multiplier ×1.7  +367
━━━━━━━━━━━━━━━━━━━━━
⭐ New personal best! (was 723)
```

**Scoring formula:**
- Base: `cards × 10`
- Accuracy bonus: `base × (accuracy / 100)`
- Speed bonus: Average response time < 5s → `+100`, < 3s → `+200`
- Streak multiplier: `1 + (streak × 0.1)`, capped at `×3.0`
- Store daily best and all-time best in localStorage

#### 2.3 Grade Journey Map

Replace the buried grade progress bars with a visual journey on the Progress page:

```
Grade 1        Grade 2        Grade 3
[████████] → [████░░░░] → [░░░░░░░░]
  80/80 ✅     42/160         0/200

     ← You are here
```

Show it as a horizontal scrollable path with:
- Completed grades: Filled, checkmark, gold border
- Current grade: Highlighted, animated progress fill
- Future grades: Locked appearance, grayed out
- Final node: "Jōyō Master 🏆"

#### 2.4 Session-End Flow Redesign

After completing a review, instead of immediately showing the summary, show a brief **celebration moment**:

1. **Completion animation** (0.5s): Checkmark + "Session Complete" with a subtle particle/confetti effect
2. **Score card** (the scoring from 2.2)
3. **Daily progress update**: "Today: 6/10 new · 15/15 reviews"
4. **Next action**: Clear CTA — either "Start New Session" if more cards available, or "All done for today! Come back in {countdown}" if queue is empty

#### 2.5 Browse Legend & Onboarding Dots

Add a visible legend to the Browse page:

```
  ● New   ● Learning   ● Mastered   ● Overdue
```

And a subtle instruction on first visit: "Tap any kanji to see details, stroke order, and readings."

---

### Tier 3 — Deepen Engagement (Ship Next Month)

#### 3.1 Interactive Onboarding Session

Replace the static "how it works" step with a guided first card:

- Show a specific easy kanji (一, "one") with coach marks
- Highlight the card: "This is a kanji. Tap to see its reading and meaning."
- After flip: Highlight rating buttons with explanation arrows
- After rating: "Great! The app will show you this kanji again at the perfect time."
- Introduce second card normally
- After 3 cards: "You've learned your first 3 kanji! 🎉 Come back tomorrow for more."

#### 3.2 Card Flip Animation (Real 3D)

Implement the actual 3D card flip that the CSS already has `perspective` for:

- Front face rotates out (0° → 90°)
- Back face rotates in (90° → 0°)  
- ~400ms duration, ease-in-out
- Optional: Subtle shadow shift during rotation

#### 3.3 Mobile Navigation Redesign

Replace the cramped header with a bottom tab bar on mobile:

```
 ┌──────────────────────────────────┐
 │  (app content fills screen)      │
 │                                  │
 │                                  │
 ├──────────────────────────────────┤
 │  📖      📚      📊      ⚙      │
 │ Study   Browse  Progress  More   │
 └──────────────────────────────────┘
```

- Study tab opens a bottom sheet with the 4 modes
- Active tab has blue icon + label
- Header simplifies to just brand + status bar

#### 3.4 Page Transitions

Add cross-fade transitions between views:

- Outgoing view: `opacity 1→0`, `translateY 0→-8px` (150ms)
- Incoming view: `opacity 0→1`, `translateY 8px→0` (200ms)  
- Use `startTransition` from React 19

#### 3.5 Streak Freeze & Recovery

- **Streak freeze**: Users can "bank" a freeze day (earned at 7-day streaks)
- **Recovery prompt**: If streak breaks, next visit shows: "Your 12-day streak ended. Start a new one today!"
- **Visual**: Frozen day shows a ❄️ icon in the heatmap

#### 3.6 Smart Study Suggestions

On the idle/home screen, below the daily goal, show contextual suggestions:

```
Suggested next:
□ 15 reviews due — clear your queue first
□ Try Writing Practice — you haven't practiced writing today
□ Grade 1: 3 kanji left to complete!
```

Driven by simple heuristics:
1. Always suggest clearing due reviews first
2. Suggest a mode the user hasn't used today
3. Surface grade-completion proximity ("3 more to finish Grade 1!")

---

### Tier 4 — Polish & Delight

#### 4.1 Kanji-of-the-Day

Show a featured kanji on the idle screen with a fun fact or mnemonic:

```
Today's Kanji: 漢
"The kanji for 'China/Chinese' appears in the word 漢字 (kanji) itself."
Readings: カン · Means: Sino-, China
```

Rotate daily based on the date. Can pull from introduced or upcoming kanji.

#### 4.2 Review Heatmap Micro-Interactions

- Heatmap cells pulse subtly on hover
- Clicking a day opens a mini-panel with that day's full stats
- Today's cell has a glowing border

#### 4.3 Achievement Gallery

A dedicated achievements page collecting all milestones:

```
🏆 Achievements

✅ First Steps — Learned 10 kanji
✅ Fifty Strong — Learned 50 kanji
🔒 Century Club — Learn 100 kanji (72/100)
🔒 Grade 1 Graduate — Complete all Grade 1 kanji
🔒 Week Warrior — Maintain a 7-day streak
🔒 ...
```

- Earned achievements: Full color, date earned
- Locked: Grayed out, progress bar if applicable
- Tap to see details

#### 4.4 Dark/Light Theme Toggle

Implement the planned `useTheme` hook:
- Toggle in settings + quick toggle in header
- Light theme: White backgrounds, dark text, adjusted accent colors
- Respects `prefers-color-scheme` system preference
- Transition between themes: smooth 200ms cross-fade

#### 4.5 Sound Effects (Optional)

Subtle audio feedback for:
- Card flip: soft "whoosh"
- Correct answer: gentle chime
- Session complete: celebration sound
- Milestone: fanfare
- Toggle in settings, off by default

---

## Implementation Priority Matrix

| ID | Feature | Effort | Impact | Priority |
|----|---------|--------|--------|----------|
| 1.1 | Onboarding flow | M | Critical | **P0** |
| 1.2 | Rename Recognition → Flashcards | XS | High | **P0** |
| 1.3 | Fix silent quiz failures | S | Critical | **P0** |
| 1.4 | Shared queue explanation | XS | Medium | **P0** |
| 1.5 | First-card rating tooltip | S | High | **P0** |
| 2.1 | Daily goal card | M | High | **P1** |
| 2.2 | Session scoring | M | High | **P1** |
| 2.3 | Grade journey map | M | High | **P1** |
| 2.4 | Session-end flow redesign | M | High | **P1** |
| 2.5 | Browse legend | XS | Medium | **P1** |
| 3.1 | Interactive onboarding | L | High | **P2** |
| 3.2 | 3D card flip animation | S | Medium | **P2** |
| 3.3 | Mobile bottom nav | M | High | **P2** |
| 3.4 | Page transitions | S | Medium | **P2** |
| 3.5 | Streak freeze & recovery | M | Medium | **P2** |
| 3.6 | Smart study suggestions | M | Medium | **P2** |
| 4.1 | Kanji-of-the-day | S | Low | **P3** |
| 4.2 | Heatmap micro-interactions | S | Low | **P3** |
| 4.3 | Achievement gallery | L | Medium | **P3** |
| 4.4 | Dark/light toggle | M | Medium | **P3** |
| 4.5 | Sound effects | M | Low | **P3** |

**Effort key:** XS = < 1hr, S = 1-3hr, M = 3-8hr, L = 8hr+

---

## Recommended Build Order

```
Week 1: Fix the broken
  1.2 Rename Recognition → Flashcards
  1.3 Fix silent quiz failures  
  1.4 Shared queue explanation
  1.5 First-card rating tooltip
  1.1 Onboarding flow

Week 2: Build the habit loop
  2.1 Daily goal card
  2.5 Browse legend
  2.4 Session-end flow redesign  
  2.2 Session scoring

Week 3: Deepen
  2.3 Grade journey map
  3.2 3D card flip animation
  3.4 Page transitions
  3.3 Mobile bottom nav

Week 4+: Polish
  3.5 Streak freeze & recovery
  3.6 Smart study suggestions
  3.1 Interactive onboarding (replaces static onboarding)
  4.x Polish items
```

---

## Files Created/Modified Summary

### New Files
| File | Feature |
|------|---------|
| `src/components/onboarding/Onboarding.tsx` | 3-step first-visit flow (1.1) |
| `src/components/onboarding/Onboarding.module.css` | Onboarding styles |
| `src/components/onboarding/RatingTooltip.tsx` | First-review rating explanation (1.5) |
| `src/components/onboarding/RatingTooltip.module.css` | Tooltip styles |
| `src/components/review/DailyGoal.tsx` | Daily progress card (2.1) |
| `src/components/review/DailyGoal.module.css` | Daily goal styles |
| `src/components/review/SessionScore.tsx` | XP scoring display (2.2) |
| `src/components/review/SessionScore.module.css` | Score styles |
| `src/components/progress/GradeJourney.tsx` | Visual grade path (2.3) |
| `src/components/progress/GradeJourney.module.css` | Journey styles |
| `src/components/progress/AchievementGallery.tsx` | Achievement page (4.3) |
| `src/components/layout/BottomNav.tsx` | Mobile bottom tabs (3.3) |
| `src/components/layout/BottomNav.module.css` | Bottom nav styles |
| `src/core/scoring.ts` | Session scoring logic (2.2) |

### Modified Files
| File | Changes |
|------|---------|
| `src/App.tsx` | Onboarding gate, page transitions |
| `src/components/layout/Header.tsx` | Rename Recognition, mobile responsive |
| `src/components/review/ReviewSession.tsx` | Onboarding integration, daily goal |
| `src/components/review/EmptyState.tsx` | Shared queue message, daily goal display |
| `src/components/review/SessionSummary.tsx` | Scoring, celebration flow |
| `src/components/review/FlashCard.tsx` | 3D flip animation |
| `src/components/review/FlashCard.module.css` | Flip CSS |
| `src/components/study/MeaningQuizSession.tsx` | Smart empty states |
| `src/components/study/ReadingQuizSession.tsx` | Smart empty states |
| `src/components/study/WritingPracticeSession.tsx` | Smart empty states |
| `src/components/browse/KanjiGrid.tsx` | Legend, first-visit hint |
| `src/components/progress/Dashboard.tsx` | Grade journey, reorder sections |
| `src/hooks/useQuizSession.ts` | Expose queueStatus |
| `src/hooks/useReviewSession.ts` | Scoring integration |
| `src/core/srs/milestones.ts` | Achievement gallery data |
| `src/styles/tokens.css` | Light theme variables (4.4) |
| `src/styles/animations.css` | Card flip, page transitions, celebrations |
