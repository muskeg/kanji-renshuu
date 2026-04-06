# 漢字練習 (Kanji Renshū) — Project Plan

## Overview

A single-page kanji flashcard application deployed to GitHub Pages. Covers all 2,136 Jōyō kanji with accurate multi-reading/multi-meaning data, spaced repetition scheduling (FSRS), stroke order practice, and local progress tracking.

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | React 19 + Vite | Fast builds, great TS support, SPA-ready |
| Language | TypeScript (strict) | Data integrity for kanji records + SRS state |
| Styling | CSS Modules + CSS custom properties | Dark theme, no external CSS deps, small bundle |
| SRS Engine | `ts-fsrs` (MIT) | Official FSRS TypeScript implementation, actively maintained, browser-compatible |
| Kanji Data | KanjiDic2 (CC-BY-SA 4.0) | Gold-standard dictionary: ON/KUN readings, meanings, grade, JLPT, frequency, radicals |
| Stroke Order | KanjiVG (CC-BY-SA 3.0) | SVG stroke-order data for writing practice |
| Testing | Vitest + React Testing Library + Playwright | Unit, component, and E2E coverage |
| Deployment | GitHub Actions → GitHub Pages | Free, automatic on push to main |
| Storage | localStorage + IndexedDB (via `idb`) | SRS state in IndexedDB (structured), settings in localStorage |

---

## Data Pipeline (Build-Time)

Raw data files are large XML; we pre-process them at build time into optimized JSON:

```
scripts/
├── parse-kanjidic2.ts    # Downloads & parses KanjiDic2 XML → JSON
├── parse-kanjivg.ts      # Extracts stroke SVG paths per kanji → JSON
└── build-data.ts         # Orchestrator: filters to Jōyō only, merges, outputs
```

### Kanji Data Schema (per entry)

```typescript
interface KanjiEntry {
  literal: string              // e.g. "漢"
  grade: number                // 1-6 (elementary), 8 (secondary/jōyō)
  jlpt: number | null         // Mapped to N5-N1 (derived from old 4-level + community lists)
  strokeCount: number
  frequency: number | null     // 1-2501 ranking (lower = more common)
  radical: number              // Classical radical number
  readings: {
    onYomi: string[]           // e.g. ["カン"]
    kunYomi: string[]          // e.g. ["あせ", "いさぎよ.い"]
    nanori: string[]           // Name readings
  }
  meanings: string[]           // English meanings, e.g. ["Sino-", "China"]
  strokeOrderSvg: string       // Inline SVG path data (from KanjiVG)
  components: string[]         // Radical/component breakdown (from KanjiVG groups)
}
```

### JLPT Mapping Strategy

KanjiDic2 only has old 4-level JLPT data. We'll use the widely-accepted community mapping:
- Old Level 4 → N5 (103 kanji)
- Old Level 3 → N4 (181 kanji)
- Old Level 2 → N3 + N2 (split using frequency data: top ~370 → N3, rest → N2)
- Old Level 1 → N1 (remaining)

The split between N2/N3 will be verified against multiple community JLPT lists for accuracy.

---

## Architecture

```
src/
├── main.tsx                     # App entry
├── App.tsx                      # Root layout, routing
├── data/
│   ├── kanji.json               # Pre-built at build time (Jōyō kanji)
│   └── loader.ts                # Lazy-loads kanji data chunks
├── core/
│   ├── srs/
│   │   ├── scheduler.ts         # ts-fsrs wrapper, FSRS config
│   │   ├── types.ts             # Card, ReviewLog, DeckState types
│   │   └── session.ts           # Review session logic (queue management)
│   ├── storage/
│   │   ├── db.ts                # IndexedDB wrapper (card state, review logs)
│   │   ├── settings.ts          # localStorage for preferences
│   │   └── export.ts            # Data export/import (JSON backup)
│   └── learning/
│       ├── strategy.ts          # Lesson introduction logic (new cards/day)
│       └── quiz-modes.ts        # Quiz mode definitions
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── BottomNav.tsx        # Mobile navigation
│   ├── review/
│   │   ├── ReviewSession.tsx    # Main review flow
│   │   ├── FlashCard.tsx        # Card display (front/back)
│   │   ├── RatingButtons.tsx    # Again/Hard/Good/Easy
│   │   └── SessionSummary.tsx   # Post-review stats
│   ├── study/
│   │   ├── KanjiDetail.tsx      # Full kanji info page
│   │   ├── StrokeOrder.tsx      # Animated SVG stroke playback
│   │   ├── WritingPractice.tsx  # Canvas-based stroke practice
│   │   ├── ReadingQuiz.tsx      # Kanji → reading quiz
│   │   └── MeaningQuiz.tsx      # Meaning ↔ kanji quiz
│   ├── browse/
│   │   ├── KanjiGrid.tsx        # Browse all kanji
│   │   ├── FilterBar.tsx        # Grade/JLPT/status filters
│   │   └── SearchBar.tsx        # Search by reading, meaning, radical
│   ├── progress/
│   │   ├── Dashboard.tsx        # Overview: streak, cards due, heatmap
│   │   ├── DailyStats.tsx       # Today's review stats
│   │   ├── StreakCalendar.tsx   # GitHub-style contribution heatmap
│   │   ├── ProgressChart.tsx    # Retention rate over time
│   │   └── LevelProgress.tsx   # Grade/JLPT level completion bars
│   └── settings/
│       ├── SettingsPage.tsx
│       ├── SrsSettings.tsx      # Retention target, max interval, daily limits
│       └── DataManagement.tsx   # Export/import/reset
├── hooks/
│   ├── useReviewSession.ts      # Review session state machine
│   ├── useKanjiData.ts          # Data loading hook
│   ├── useProgress.ts           # Progress stats computation
│   └── useTheme.ts              # Dark/light theme toggle
├── utils/
│   ├── japanese.ts              # Hiragana/katakana detection, okurigana splitting
│   └── sanitize.ts              # Input sanitization (XSS prevention)
└── styles/
    ├── global.css               # CSS reset, custom properties, dark theme
    ├── tokens.css               # Design tokens (colors, spacing, typography)
    └── animations.css           # Card flip, stroke draw animations
```

---

## Features — Phased Delivery

### Phase 1: Core Foundation ✅
1. ~~**Project scaffolding** — Vite + React + TS + Vitest + CSS Modules~~
2. ~~**Data pipeline** — Parse KanjiDic2 + KanjiVG, output optimized JSON~~
3. ~~**Storage layer** — IndexedDB for SRS state, localStorage for settings~~
4. ~~**FSRS integration** — `ts-fsrs` wrapper with sensible defaults~~
5. ~~**Basic flashcard review** — Kanji → Reading + Meaning (front/back card)~~
6. ~~**Rating system** — Again/Hard/Good/Easy buttons with next-review preview~~
7. ~~**Dark minimal UI** — Responsive layout, mobile-first~~

### Phase 2: Learning Modes & Browse ✅
8. ~~**Meaning → Kanji recognition** — Multiple choice quiz~~
9. ~~**Kanji → Reading quiz** — Type-in or multiple choice~~
10. ~~**Kanji detail page** — All readings, meanings, stroke count, grade, JLPT~~
11. ~~**Stroke order animation** — SVG path animation with playback controls~~
12. ~~**Browse/search** — Grid view, filter by grade/JLPT/status, search~~
13. ~~**New card introduction** — Configurable daily new card limit~~

### Phase 3: Writing & Progress ✅
14. ~~**Writing practice** — Canvas drawing with stroke-by-stroke validation~~
15. ~~**Daily stats dashboard** — Cards reviewed, accuracy, time spent~~
16. ~~**Streak calendar** — Heatmap of daily activity~~
17. ~~**Progress charts** — Retention curve, cards by state, grade completion~~
18. ~~**Level progress bars** — Per-grade and per-JLPT completion tracking~~

### Phase 4: Polish & Release ✅
19. ~~**Data export/import** — JSON backup of all progress~~
20. ~~**Settings panel** — SRS parameters, daily limits, theme, new cards/day~~
21. ~~**Keyboard shortcuts** — 1/2/3/4 for ratings, space to flip~~
22. ~~**PWA support** — Service worker for offline use~~
23. ~~**GitHub Pages deployment** — CI/CD via GitHub Actions~~
24. **E2E tests** — Playwright tests for critical flows (deferred)

---

## SRS Configuration (FSRS Defaults)

```typescript
const DEFAULT_SRS_CONFIG = {
  request_retention: 0.9,    // Target 90% recall rate
  maximum_interval: 365,     // Cap at 1 year
  enable_fuzz: true,         // Slight randomness to prevent clustering
  enable_short_term: true,   // Use learning steps for new cards
  learning_steps: ['1m', '10m'],      // New card steps
  relearning_steps: ['10m'],           // Lapse relearning steps
}
```

### Review Session Logic
- **Daily new cards**: Default 10, configurable 0-50
- **Daily review limit**: Default unlimited, configurable
- **Queue order**: Due reviews first, then new cards
- **Review modes**: Configurable per session (reading, meaning, or mixed)
- **Session summary**: Accuracy, time, cards by rating breakdown

---

## Quiz Modes

### 1. Recognition (Kanji → Info)
- **Front**: Large kanji character
- **Back**: All ON/KUN readings, meanings, example context
- **Rating**: Self-assessed (Again / Hard / Good / Easy)

### 2. Meaning → Kanji
- **Prompt**: English meaning displayed
- **Options**: 4 kanji choices (1 correct + 3 distractors from same grade)
- **Rating**: Binary → mapped to Again (wrong) or Good (correct)

### 3. Reading Quiz
- **Prompt**: Kanji displayed
- **Input**: Type reading in hiragana/katakana
- **Validation**: Accept any valid ON or KUN reading
- **Rating**: Binary → mapped to Again/Good

### 4. Writing Practice
- **Prompt**: Reading + meaning displayed
- **Canvas**: Draw strokes on touch/mouse canvas
- **Validation**: Stroke-by-stroke comparison against KanjiVG path data
- **Feedback**: Correct strokes in green, guide strokes in gray

---

## Progress Tracking

### Data Stored (IndexedDB)

```typescript
interface CardState {
  kanjiLiteral: string       // Primary key
  fsrsCard: Card             // ts-fsrs Card object (due, stability, difficulty, etc.)
  lastReviewedAt: number     // Timestamp
  totalReviews: number
  correctReviews: number
  introduced: boolean        // Has the user seen this kanji?
  introducedAt: number | null
}

interface ReviewLog {
  id: string                 // Auto-generated UUID
  kanjiLiteral: string
  rating: Rating             // Again=1, Hard=2, Good=3, Easy=4
  mode: QuizMode             // recognition, meaning, reading, writing
  timestamp: number
  responseTimeMs: number     // Time to answer
  fsrsLog: ReviewLogEntry    // ts-fsrs log entry
}

interface DailyStats {
  date: string               // YYYY-MM-DD
  newCardsIntroduced: number
  reviewsCompleted: number
  correctCount: number
  totalTimeMs: number
  streakDay: boolean         // Did user do at least 1 review?
}
```

### Dashboard Metrics
- **Current streak**: Consecutive days with ≥1 review
- **Cards by state**: New / Learning / Review / Relearning counts
- **Today**: Reviews done, accuracy %, new cards learned
- **Retention rate**: Rolling 30-day average recall
- **Heatmap**: Last 365 days activity (GitHub contribution style)
- **Level completion**: Bars per grade (1-6, 8) and per JLPT (N5-N1)
- **Forecast**: Predicted reviews for next 7 days

---

## UI Design Principles

### Dark Minimal Theme
- **Background**: `#0d1117` (GitHub dark)
- **Surface**: `#161b22`
- **Primary accent**: `#58a6ff` (blue) for interactive elements
- **Success**: `#3fb950` (green)
- **Warning**: `#d29922` (amber)
- **Error**: `#f85149` (red)
- **Text**: `#e6edf3` (primary), `#8b949e` (secondary)
- **Kanji display**: Large, clear font — Noto Sans JP or Noto Serif JP

### Typography
- Kanji characters: 4-8rem for flashcards, Noto Sans JP
- Readings: 1.2-1.5rem, clear distinction between ON (katakana) and KUN (hiragana)
- UI text: System font stack for labels/buttons

### Responsive
- Mobile-first (360px+)
- Tablet: side panel for kanji details
- Desktop: full dashboard with side navigation
- Touch-friendly: large tap targets (≥44px), swipe gestures for card navigation

### Animations
- Card flip: 3D CSS transform (0.4s)
- Stroke order: sequential SVG path animation
- Page transitions: subtle fade/slide
- Rating feedback: brief color flash

---

## Security Considerations

1. **No backend / no auth** — all data is client-side, no attack surface for server-side issues
2. **XSS prevention** — All kanji data is pre-processed at build time (no runtime HTML injection); React's JSX auto-escapes by default; any user input (search) is sanitized before use
3. **Content Security Policy** — Strict CSP headers via meta tags (no inline scripts, no eval)
4. **Import/export validation** — JSON schema validation on imported data (prevent malformed data injection)
5. **No external API calls** — Fully static, no CORS/SSRF concerns
6. **Dependency auditing** — `npm audit` in CI, minimal dependency tree
7. **Subresource Integrity** — SRI hashes for any CDN resources (fonts)
8. **localStorage/IndexedDB** — No sensitive data stored; progress data only

---

## Testing Strategy

### Unit Tests (Vitest)
- SRS scheduler: verify FSRS card transitions for all ratings
- Data parser: validate kanji entry parsing from raw XML
- Japanese utils: reading validation, okurigana splitting
- Storage layer: IndexedDB CRUD operations
- Progress calculations: streak counting, retention rate math

### Component Tests (React Testing Library)
- FlashCard: renders front/back correctly, flip interaction
- RatingButtons: correct rating dispatched
- ReviewSession: full session flow (flip → rate → next card)
- SearchBar: filter results match input
- StrokeOrder: SVG renders correct number of strokes

### E2E Tests (Playwright)
- First-time user flow: sees welcome → starts first review → rates card
- Complete review session: review all due cards, see summary
- Browse and filter: navigate to grid, filter by JLPT N5, open detail
- Settings: change daily new card limit, verify applied
- Export/import: export data, clear, re-import, verify state restored
- Mobile viewport: full flow on 375px width

### Data Integrity Tests
- All 2,136 Jōyō kanji present in built data
- Every kanji has ≥1 reading and ≥1 meaning
- Grade values are valid (1-6, 8)
- No duplicate entries
- Stroke order SVG exists for each kanji
- JLPT mapping covers expected counts per level

---

## CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Build & Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build:data   # Parse KanjiDic2 + KanjiVG
      - run: npm run build        # Vite production build
      - uses: actions/deploy-pages@v4
```

---

## Additional Suggestions (Beyond Original Scope)

### High-Value Additions
1. **Mnemonic hints** — Short memory aids for difficult kanji (community-sourced or AI-generated at build time). Helps with retention of abstract kanji.

2. **Similar kanji warnings** — When reviewing, show visually similar kanji to prevent confusion (e.g., 待 vs 持 vs 特). Use radical/component overlap to compute similarity.

3. **Component/radical learning path** — Teach radicals first before composite kanji. A user who knows 氵(water) + 漢 components learns faster.

4. **Example vocabulary** — Show 2-3 common words using each kanji (from JMdict, also CC). e.g., 日 → 日本 (にほん), 今日 (きょう), 日曜日 (にちようび).

5. **Audio pronunciation** — TTS for readings using Web Speech API (free, browser-native). No external API needed.

6. **Leech detection** — Flag kanji that consistently get "Again" rating (≥8 lapses). Suggest the user study these separately or add a mnemonic.

7. **Review forecast** — Show predicted workload for the next 7 days so the user can plan study time.

8. **Undo last rating** — Allow undoing the last review rating (FSRS `rollback()` supports this natively).

9. **Focus modes** — "Weak kanji" mode (review only leeches), "JLPT N3 cram" mode (filter to specific level), "New only" mode.

10. **Offline PWA** — Service worker caches all assets. Works fully offline after first load. Critical for commute study.

11. **Data migration versioning** — IndexedDB schema versioning so future updates don't break existing user data.

12. **Accessibility** — Screen reader support, high contrast mode, keyboard-only navigation. Important for inclusive design.

### Nice-to-Have (Lower Priority)
13. **Kanji composition tree** — Visual breakdown showing how components combine (e.g., 休 = 亻+ 木)
14. **Spaced reading** — Short passages using only kanji the user has learned
15. **Multi-device sync** — Optional GitHub Gist or JSON file sync for cross-device progress
16. **Theme customization** — User-selectable accent colors, font size adjustments

---
