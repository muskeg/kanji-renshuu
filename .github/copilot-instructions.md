# Kanji Renshū — Workspace Instructions

## Project Overview

A single-page kanji flashcard app (React 19 + Vite 8 + TypeScript 6 strict) deployed to GitHub Pages. Covers all 2,136 Jōyō kanji with FSRS spaced repetition, stroke order practice, and local progress tracking.

## Tech Stack

- **Framework**: React 19 + Vite 8 (SPA, base path `/kanji-renshuu/`)
- **Language**: TypeScript 6 (strict mode, `@/*` path alias)
- **Styling**: CSS Modules + CSS custom properties (dark theme, `localsConvention: 'camelCase'`)
- **SRS Engine**: `ts-fsrs` (FSRS algorithm, MIT license)
- **Storage**: IndexedDB via `idb` (card state, review logs, daily stats), `localStorage` (settings)
- **Data Sources**: KanjiDic2 (CC-BY-SA 4.0), KanjiVG (CC-BY-SA 3.0)
- **Testing**: Vitest + React Testing Library + Playwright
- **Deployment**: GitHub Actions → GitHub Pages

## Code Style

- Use `import type {}` for type-only imports (verbatimModuleSyntax is enabled)
- Use `@/` path alias for all imports (e.g., `@/core/srs/types`)
- CSS Modules with `.module.css` extension; access classes via camelCase
- Prefer named exports over default exports
- No `any` types — use `unknown` and narrow
- Use `const` assertions and satisfies where appropriate

## Architecture

```
src/
├── core/srs/        # FSRS wrapper, types, session logic
├── core/storage/    # IndexedDB (db.ts), localStorage (settings.ts)
├── components/      # React components organized by feature
├── hooks/           # Custom React hooks
├── data/            # Pre-built kanji JSON + loader
├── styles/          # Global CSS, tokens, animations
└── utils/           # Japanese text utils, sanitization
scripts/             # Build-time data pipeline (KanjiDic2 → JSON)
```

## Build Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + Vite production build |
| `npm run build:data` | Download KanjiDic2 and generate kanji JSON |
| `npm run test` | Run Vitest test suite |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type checking (no emit) |

## Conventions

- **Kanji data** is pre-processed at build time, never fetched at runtime
- **Card state** uses ts-fsrs `Card` type internally; wrapped in `CardState` for IndexedDB
- **Ratings** use numeric values 1-4 (Again, Hard, Good, Easy) matching ts-fsrs `Rating` enum
- **Quiz modes**: `'recognition' | 'meaning' | 'reading' | 'writing'`
- **Date format** for daily stats: `YYYY-MM-DD` strings
- **CSS custom properties** defined in `src/styles/tokens.css`
- **Animations** defined in `src/styles/animations.css`

## Security

- No backend, no auth — all client-side
- CSP meta tag in `index.html`
- React JSX auto-escapes; sanitize any user input before use
- Validate JSON on import/export
- Run `npm audit` regularly

## Reference

See docs/PLAN.md for full project plan, phased delivery, and architecture details.
