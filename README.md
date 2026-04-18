# 漢字練習 — Kanji Renshū

A spaced repetition flashcard app for learning all **2,136 Jōyō kanji**. Built as a PWA — installable, works offline, no account required. All progress stays on your device.

## Features

- **FSRS spaced repetition** — Modern scheduling algorithm (via [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)) that adapts to how well you know each kanji
- **Multiple study modes** — Flashcard review, meaning quiz, reading quiz, and stroke-order writing practice
- **Stroke order practice** — Draw kanji stroke-by-stroke with real-time validation using KanjiVG data
- **Full kanji data** — Readings (on'yomi, kun'yomi, nanori), meanings, grade level, JLPT level, frequency rank, radical, and components
- **Browse & search** — Grid view of all kanji with filters for grade, JLPT level, and SRS status
- **Progress tracking** — Streak calendar, daily stats, grade completion bars, review forecast, and achievement gallery
- **PWA** — Installable on mobile and desktop, full offline support with Workbox precaching
- **Bilingual** — English and French UI
- **Dark theme** — Dark by default, with light and system-follow options
- **Data portability** — Export/import all progress as JSON

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + Vite 8 |
| Language | TypeScript 6 (strict) |
| Styling | CSS Modules + CSS custom properties |
| SRS | [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) |
| Storage | IndexedDB ([idb](https://github.com/jakearchibald/idb)) + localStorage |
| Kanji data | [KanjiDic2](http://www.edrdg.org/wiki/index.php/KANJIDIC_Project) (CC-BY-SA 4.0) |
| Stroke order | [KanjiVG](https://kanjivg.tagaini.net/) (CC-BY-SA 3.0) |
| PWA | [vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa) + Workbox |
| Testing | Vitest + React Testing Library |
| Deployment | GitHub Actions → GitHub Pages |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm run test

# Type check
npm run typecheck

# Lint
npm run lint

# Production build
npm run build
```

### Data Pipeline

Kanji data is pre-processed at build time from KanjiDic2 XML and KanjiVG SVG into optimized JSON. To regenerate:

```bash
npm run build:data
```

This downloads the source files, parses them, and outputs grade-split JSON files in `src/data/`.

## Project Structure

```
src/
├── core/
│   ├── srs/           # FSRS wrapper, scheduler, session queue logic
│   ├── storage/       # IndexedDB (cards, logs, stats), localStorage (settings), export/import
│   └── learning/      # New card strategy, quiz mode definitions
├── components/
│   ├── home/          # Home page with kanji of the day
│   ├── review/        # Flashcard session, rating buttons, session summary
│   ├── study/         # Meaning quiz, reading quiz, writing practice, kanji detail
│   ├── browse/        # Kanji grid, search, filters
│   ├── progress/      # Dashboard, streak calendar, grade journey, achievements
│   ├── settings/      # SRS params, appearance, data management
│   ├── layout/        # Header, bottom nav, page transitions
│   └── ui/            # Shared UI components (toast, update prompt)
├── hooks/             # React hooks (review session, quiz, progress, theme, etc.)
├── i18n/              # English + French translations
├── data/              # Pre-built kanji JSON + loader
├── styles/            # Global CSS, design tokens, animations
└── utils/             # Japanese text utils, sanitization, sounds
scripts/               # Build-time data pipeline (KanjiDic2/KanjiVG → JSON)
```

## How It Works

1. **Kanji data** is parsed from KanjiDic2 and KanjiVG at build time into JSON, split by school grade
2. **New cards** are introduced daily (configurable limit), ordered by grade then frequency
3. **Reviews** are scheduled by FSRS based on your past performance — each rating (Again / Hard / Good / Easy) updates the card's memory model
4. **All state** is stored locally: card states and review logs in IndexedDB, settings in localStorage
5. **The service worker** precaches all assets on first load for full offline use

## Data Sources & Licenses

- **KanjiDic2** — [EDRDG](http://www.edrdg.org/wiki/index.php/KANJIDIC_Project), licensed under [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- **KanjiVG** — [KanjiVG Project](https://kanjivg.tagaini.net/), licensed under [CC-BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)

## License

MIT
