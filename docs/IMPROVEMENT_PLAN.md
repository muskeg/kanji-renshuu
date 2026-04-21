# Kanji Renshū — Improvement Roadmap

**Status:** Proposed
**Last updated:** April 2026
**Companion docs:** [PLAN.md](PLAN.md) (architecture), [ux-improvements.md](ux-improvements.md) (Phase 5 spec), [ux-redesign.md](ux-redesign.md) (game-design pass)

This document captures a complete improvement plan derived from a full audit of the
current codebase (functionalities, SRS engine, data pipeline, storage, UI/UX,
tests, deployment). It is organized into a) a snapshot of where the app stands
today, b) prioritized improvement themes, and c) a phased roadmap with concrete,
file-level work items.

---

## 1. Snapshot — Where the App Stands Today

### 1.1 What works well
- **Solid SRS foundation.** [scheduler.ts](../src/core/srs/scheduler.ts) wraps
  `ts-fsrs` cleanly with configurable retention, max interval, learning steps,
  fuzz, and short-term scheduling. [session.ts](../src/core/srs/session.ts)
  builds a sensible queue (due → new, sorted by grade then frequency) and
  returns a typed `QueueStatus` with a `reason` discriminator.
- **Complete Jōyō coverage.** Build pipeline ([build-data.ts](../scripts/build-data.ts),
  [parse-kanjivg.ts](../scripts/parse-kanjivg.ts)) ships all 2,136 kanji with
  readings (on/kun/nanori), meanings (EN + FR), grade, JLPT (old 4-level),
  frequency, radical, components, and inline KanjiVG stroke-order SVG.
- **Four study modes** sharing a single queue: flashcards, meaning quiz, reading
  quiz (with romaji-to-kana input), guided writing practice with stroke
  validation.
- **Real progress UI.** [Dashboard.tsx](../src/components/progress/Dashboard.tsx)
  surfaces today's stats, streak calendar, grade journey, level progress,
  achievements, and a 30-day forecast.
- **Production-grade plumbing.** Strict TypeScript 6, CSS Modules, IndexedDB via
  `idb`, PWA with Workbox precache + update prompt, GitHub Actions CI that runs
  typecheck → lint → test → build:data → build → deploy to Pages.
- **Bilingual** EN/FR with reactive context, dark/light/system theme, UI
  scaling, JSON export/import for backup.

### 1.2 What's incomplete or partial
- **No content beyond glosses.** No mnemonics, no vocabulary examples, no
  audio/TTS, no etymology, no look-alike clusters, no per-stroke metadata.
- **Implicit learning path.** Cards are introduced grade → frequency, but there
  are no lessons, units, prerequisite gating (kanji can be introduced before
  their components), or radical-first pathway.
- **Gamification is decorative.** Streak counter, milestone toasts and
  achievement badges exist, but the session scoring system in
  [scoring.ts](../src/core/srs/scoring.ts) is computed and stored without ever
  being shown in the UI. No XP, no levels, no quests, no leaderboards.
- **JLPT data is the legacy 4-level field**, not the modern N5–N1 split that
  filters and badges imply. Mapping logic from [PLAN.md](PLAN.md) is not yet
  implemented.
- **Custom decks don't exist.** Browse filters are ad-hoc; users cannot save a
  named subset (e.g. "JLPT N3 only", "Cooking kanji").
- **Analytics are shallow.** No per-kanji difficulty report, no
  weakest-cards list, no mode-specific accuracy breakdown, no retention by
  radical/phonetic family.
- **Test coverage is uneven.** ~8 unit/hook test files cover SRS, queue,
  storage, and Japanese utilities well. There are **no Playwright E2E tests**
  despite the stack listing them, and no a11y or visual-regression tests.
- **UX rough edges documented in [ux-redesign.md](ux-redesign.md):**
  jargon-heavy mode names, silent quiz-start failures when the queue is empty,
  cramped mobile nav at 360px, minimal page transitions, fade-only card flip.

### 1.3 Architectural risks
- **Single IndexedDB schema version (v1).** No migration scaffolding exists, so
  any breaking change to `CardState`, `ReviewLogEntry`, or `DailyStats` will
  require ad-hoc upgrades.
- **All kanji JSON ships in the bundle.** Lazy-loaded by grade, but the largest
  grade file is several hundred KB. As content depth grows (vocab, mnemonics,
  audio refs), the data layer needs a firmer split.
- **No telemetry** (intentional for a privacy-first PWA), but this also means
  there is no signal on what users actually do, making prioritization
  qualitative.

---

## 2. Improvement Themes

Six themes drive the roadmap. Each is scored on **user impact** (1–5) and
**implementation cost** (1–5, lower is cheaper).

| # | Theme | Impact | Cost | Why it matters |
|---|-------|--------|------|----------------|
| T1 | **First-impression UX & clarity** | 5 | 2 | Users abandon when they don't understand modes, queue sharing, or empty states. Mostly already specced in [ux-redesign.md](ux-redesign.md). |
| T2 | **Gamification & motivation loop** | 5 | 3 | The plumbing (scores, milestones, streaks) exists but is invisible. Wiring it into the UI is high-leverage. |
| T3 | **Content depth (vocab, mnemonics, audio)** | 5 | 4 | Biggest competitive gap vs. WaniKani / Anki decks; without examples, kanji feel abstract. |
| T4 | **Customization & learning paths** | 4 | 3 | Custom decks, radical-first, JLPT-first orderings unlock self-directed study. |
| T5 | **Analytics & insight** | 3 | 2 | "Which kanji do I struggle with?" turns review logs (already captured) into actionable feedback. |
| T6 | **Quality, testing, accessibility** | 4 | 3 | Playwright E2E, axe a11y checks, IndexedDB migrations, error boundaries — protects everything else. |

---

## 3. Functionality Improvements

### 3.1 SRS & session logic
- **Retry-struggled-cards mode at end of session.** Build a transient queue from
  cards rated `Again`/`Hard` in the just-finished session and let the user run
  it as a mini drill. Touches [session.ts](../src/core/srs/session.ts) and
  [SessionSummary.tsx](../src/components/review/SessionSummary.tsx).
- **Leech detection.** Flag cards with N consecutive `Again` ratings (e.g. 4)
  as leeches; surface them in a "Stuck on these" section of the dashboard with
  options to suspend, edit notes, or open in writing mode. Logic lives in
  [scheduler.ts](../src/core/srs/scheduler.ts) / new
  `core/srs/leech.ts`.
- **Suspend / bury / un-introduce.** Per-card actions for users who introduced
  a kanji prematurely. Requires a `suspended` flag on `CardState` →
  IndexedDB schema bump.
- **Undo last review.** Single-step undo using the latest `ReviewLogEntry` and
  the previous `fsrsCard` snapshot (we already log full FSRS state).
- **Per-mode retention targeting.** Allow the "default quiz mode" setting to
  also remember per-mode `requestRetention` so writing can be tuned tighter
  than recognition.

### 3.2 Quiz modes
- **Reading quiz: distinguish on-yomi vs kun-yomi.** Show a tag ("kun" /
  "on") next to the input so the user knows which reading family is being
  asked. Optional difficulty toggle: "any reading" vs "specific reading".
- **Listening mode** (depends on T3 audio). Play the reading, user picks the
  kanji.
- **Production mode (English → write the kanji).** Multiple-choice today;
  add a free-write variant using the existing canvas + KanjiVG stroke matcher
  in [strokeMatch.ts](../src/utils/strokeMatch.ts).
- **Sentence cloze mode** (depends on T3 vocab). Show an example sentence
  with one kanji blanked; pick from candidates.
- **Speed round / time-attack mini-game.** 60-second sprint of recognition
  cards, no SRS impact, contributes to a separate scoreboard.

### 3.3 Browse & search
- **SRS status badges on tiles** (already specced in
  [ux-improvements.md](ux-improvements.md)). Color-code new / learning /
  review / mature; matches Dashboard.
- **Saved searches → custom decks** (T4). Persist a `Deck` with id, name,
  filter spec, color. Decks become an alternate queue source in
  [session.ts](../src/core/srs/session.ts).
- **"Show me look-alikes"** action on the detail view (depends on T3
  look-alike clusters).
- **Keyboard shortcuts for browse** (`/` to focus search, `1`–`6/8` to filter
  by grade, `Esc` to close detail).

### 3.4 Settings
- **Notifications.** Local web-notification reminder at a user-chosen time
  ("It's review time — N cards waiting"). Requires a Service Worker hook;
  graceful degradation when permission denied.
- **Per-grade daily new-card cap** (advanced section). Lets users hold grade
  6 to 5/day while burning grade 1 at 20/day.
- **"Pause SRS" toggle** for vacations — freezes due dates without breaking
  the streak (pairs with streak-freeze).
- **Reset / nuke** with explicit "type the kanji 完 to confirm" guard.

---

## 4. UX & Visual Design Improvements

These largely formalize and execute the plans in
[ux-redesign.md](ux-redesign.md).

### 4.1 First impression (Tier 1)
1. **3-step onboarding** (Welcome → Choose Pace → How It Works) replacing
   today's static [Onboarding.tsx](../src/components/onboarding/Onboarding.tsx).
   "Choose Pace" sets `dailyNewCards` from preset {Casual 5, Standard 10,
   Intense 20}.
2. **Rename modes to plain English** in [quiz-modes.ts](../src/core/learning/quiz-modes.ts):
   "Recognition" → **Flashcards**, others kept but with one-line subtitles.
3. **Smart empty states** for every mode entry point (the queue infrastructure
   already returns `reason`). Mode buttons should *never* silently no-op.
4. **Persistent rating-button tooltips** for the first 5 sessions
   (counter in localStorage), then auto-dismiss.
5. **Disclosure banner** "All study modes share the same SRS queue" on the
   home page until dismissed.

### 4.2 Visual & motion polish
- **3D card flip** for [FlashCard.tsx](../src/components/review/FlashCard.tsx)
  using `transform: rotateY()` + `transform-style: preserve-3d`. Respect
  `prefers-reduced-motion`.
- **Page transitions** wired into the existing
  [PageTransition.tsx](../src/components/layout/PageTransition.tsx) shell
  (slide+fade per route).
- **Micro-interactions on rating.** Confetti burst on session-complete, soft
  pulse on streak increment, "+XP" counter rising from rating button (T2).
- **Hero kanji typography.** Bigger character on review front, with a subtle
  background watermark of the radical.
- **Theme toggle in header**, replacing the buried Settings → Appearance flow.

### 4.3 Mobile & responsive
- **Bottom nav redesign** for ≤360px: 4 icons + label tray that expands on
  long-press. Currently overflows.
- **Swipe gestures** on review cards: left = Again, down = Hard, right = Good,
  up = Easy. Mirrored for left-handers via setting.
- **One-handed mode** (compact layout, controls anchored bottom-third).
- **Honour `safe-area-inset-*`** so installed PWAs don't sit under the iOS
  home indicator.

### 4.4 Accessibility
- **`prefers-reduced-motion` support** across [animations.css](../src/styles/animations.css)
  and JS-driven transitions.
- **Visible focus rings on every interactive element** (already global, but
  some custom buttons override `:focus-visible`).
- **Screen-reader pronounceable labels** for kanji (`aria-label="kanji 漢,
  meaning Chinese, readings kan, ayashi"`).
- **Color-blind safe palette** for status badges (don't rely on hue alone —
  add icons or shapes).
- **Axe + Playwright a11y audits in CI** (T6).

---

## 5. Gamification & Motivation

Gamification today is decorative. The goal is a coherent **motivation loop**:
*review → score → level → reward → next-day return*.

### 5.1 Make scoring visible
- Surface the existing `core/srs/scoring.ts` output in
  [SessionSummary.tsx](../src/components/review/SessionSummary.tsx):
  base + accuracy bonus + speed bonus + streak multiplier = total, with a
  bar showing personal best.
- Add a per-rating "+N" pop-up animation on every card.

### 5.2 XP & Levels (new)
- Define `XP = sum(session_score)` stored in IndexedDB (`stats.lifetimeXp`).
- Level curve: `level = floor(sqrt(XP / 100))` (gentle, predictable).
- New module `core/gamification/xp.ts` + UI in
  [LevelProgress.tsx](../src/components/progress/LevelProgress.tsx) (already
  exists — repurpose to show user level, not just kanji-grade progress).
- Level-up celebration: full-screen modal with the next "Sensei rank" title
  (Apprentice → Student → Adept → Scholar → Master → Sage).

### 5.3 Streak system upgrade
- **Streak-freeze tokens.** Earn 1 every 7-day streak, max 3. Auto-spent on
  missed days. UI in [StatusBar.tsx](../src/components/layout/StatusBar.tsx).
- **Visual escalation:** 🔥 at 3 days, blue flame at 30, rainbow at 100,
  diamond at 365.
- **Streak history graph** on Dashboard separate from the calendar (longest
  streak, current streak, freezes used).

### 5.4 Achievements 2.0
Today's achievements are count milestones only. Expand to multiple families:

| Family | Examples |
|--------|----------|
| Milestones | 10 / 50 / 100 / 500 / 1000 / 2000 kanji introduced (existing) |
| Mastery | All N5 mature, All grade-1 mature, 100% retention week |
| Skill | "Perfect session" (no Again), "Lightning" (avg < 3s), "Polyglot" (use FR + EN in one week) |
| Persistence | 7 / 30 / 100 / 365-day streak, "Comeback" (resume after 14d gap) |
| Exploration | Try all 4 modes, customize a deck, install the PWA |

Implementation: `core/gamification/achievements.ts` with declarative rules
evaluated post-review; surface in
[AchievementGallery.tsx](../src/components/progress/AchievementGallery.tsx)
with locked / unlocked / progress states.

### 5.5 Daily quests (optional, Tier 3)
- Three rotating daily objectives (e.g. "Review 20 cards", "Reach 90%
  accuracy", "Practice 5 grade-3 kanji"). Completing all three grants bonus
  XP and a streak-freeze chance.

### 5.6 Local-only "leaderboard"
- Personal-best board: top 10 sessions by score, fastest sessions, longest
  streaks, most XP days. No network. Lives on Dashboard.

---

## 6. Content Improvements

This is the largest single lever for product quality.

### 6.1 Vocabulary examples (priority 1)
- **Source:** JMdict/EDICT (CC-BY-SA 4.0, EDRDG) — same family as KanjiDic2.
- **Pipeline:** Add `scripts/build-vocab.ts` that downloads JMdict, indexes
  entries by kanji literal, picks the top N (3–5) by frequency, exports a
  `vocab-g{N}.json` companion file.
- **Schema addition:**
  ```ts
  type VocabExample = {
    word: string;       // 漢字
    reading: string;    // かんじ
    meanings: string[]; // ["Chinese characters"]
    common: boolean;
  };
  ```
- **UI:** new `Examples` section in
  [KanjiDetail.tsx](../src/components/study/KanjiDetail.tsx); also unlocks
  the **sentence cloze** quiz mode.

### 6.2 Mnemonics
- **MVP:** user-editable text field per kanji (stored in IndexedDB
  `notes` store). Markdown allowed, sanitized via
  [sanitize.ts](../src/utils/sanitize.ts).
- **Stretch:** ship a curated mnemonic set sourced from a CC-licensed
  community list (or generate via the radical decomposition we already
  have) — clearly labelled "community" vs "your note".

### 6.3 Audio pronunciation
- **Strategy A (no extra payload):** use the Web Speech API
  (`SpeechSynthesisUtterance` with `lang: 'ja-JP'`) for on-demand TTS.
  Quality varies by platform but adds zero MB.
- **Strategy B (curated):** integrate a CC-licensed voice set
  (e.g. JSUT, individual reading audio from Tatoeba) — heavier, cache via SW.
- **Recommended:** Ship A first behind a `Settings → Audio` toggle, evaluate
  user demand before B.

### 6.4 Etymology & radical decomposition
- KanjiDic2 already exposes `components` (we extract it). Build a
  **radical-graph viewer** showing the kanji → its components → each
  component's own meaning. Recursive but capped at depth 2.
- **Source:** `kradfile`/`radkfile` (EDRDG, CC-BY-SA) for inverse lookup
  ("which kanji contain this radical").

### 6.5 Look-alikes
- Pre-compute clusters offline by radical similarity + stroke-count delta ≤ 1.
- Store as `lookalikes-g{N}.json`. Surface in detail view and as an
  optional "trap" in distractor selection for the meaning quiz.

### 6.6 JLPT N5–N1 mapping
- Already specced in [PLAN.md](PLAN.md). Implement using the public
  Tanos JLPT lists (or recompute from frequency + curated overrides).
- Update [FilterBar.tsx](../src/components/browse/FilterBar.tsx) labels
  (currently 1–4) and [GradeJourney.tsx](../src/components/progress/GradeJourney.tsx)
  to show N-level progress alongside grade progress.

### 6.7 Localization expansion
- Current EN + FR. Adding ES / DE / PT translations is mostly content work
  in [src/i18n/](../src/i18n/) plus per-kanji `meaningsXx[]` if available
  from KanjiDic2 (it ships several).

---

## 7. Analytics & Insight

All inputs already exist as `ReviewLogEntry` rows in IndexedDB.

- **Weakest 20 kanji** (lowest retention or most `Again`s in last 30 days),
  with one-tap "drill these now" → builds an ad-hoc queue.
- **Per-mode accuracy** chart on Dashboard (recognition vs meaning vs reading
  vs writing).
- **Reviews-per-hour heatmap** (when do you study best?).
- **Forecast accuracy.** Compare predicted reviews/day to actual; surfaces
  whether the FSRS retention target is well-tuned.
- **Card-level history modal** from any kanji detail: timeline of reviews,
  ratings, intervals, retention curve.
- All charts via lightweight inline SVG (no chart lib added).

---

## 8. Customization & Learning Paths

- **Custom decks** as first-class: stored in IndexedDB `decks` store
  (`{id, name, filter, color, createdAt}`), selectable as a queue source
  in study mode. Filters reuse the browse filter spec.
- **Radical-first path.** New `core/learning/paths.ts` exposing alternative
  orderings: by-grade (default), by-JLPT, by-frequency, by-radical-first
  (introduce all kradfile radicals before compounds), by-stroke-count.
- **Lesson grouping.** Group every 5 introduced kanji into a "lesson" with
  a progress checkpoint and small XP reward; addresses the "endless grind"
  feeling.
- **Pre-requisite gating** (opt-in): in radical-first mode, refuse to
  introduce a compound until its components are at least "learning".

---

## 9. Quality, Testing, and Accessibility

### 9.1 Testing gaps to close
- **Playwright E2E** (the stack already lists it but no specs exist). Cover:
  first-run onboarding, finishing a 5-card session, exporting/importing
  data, switching theme & language, installing the PWA.
- **React Testing Library** component coverage for FlashCard, RatingButtons,
  KanjiGrid, SessionSummary, Dashboard.
- **a11y in CI** via `@axe-core/playwright` per route.
- **Visual regression** (optional) via Playwright screenshot diffs on key
  pages.
- **Coverage threshold** in Vitest config (e.g. 70% lines on
  `src/core/**`).

### 9.2 Resilience
- **IndexedDB schema migrations.** Build a `migrations` array invoked from
  `db.ts`'s `upgrade` callback. Bump to v2 the moment the first new field
  ships (suspended flag, deck membership, etc.).
- **Error boundary** at the App root with a "Reset cards / contact support"
  fallback. Attach the last 50 console errors for export.
- **Import validation** with a strict schema (zod or hand-rolled) — current
  validation is shallow.
- **Service worker rollback.** Surface an explicit "Use older version" button
  if a new SW activation breaks the app.

### 9.3 Security
- Re-audit the CSP after adding any new font/image source.
- Confirm `dangerouslySetInnerHTML` only ever receives sanitized SVG
  (already true for KanjiVG; lock it down with a runtime allowlist of
  attributes via `sanitize.ts`).
- Run `npm audit --production` in CI as a non-blocking step.

### 9.4 Performance
- **Code-split per route.** App is small but Dashboard pulls all logs for
  forecast/streak; defer with `React.lazy` and a skeleton.
- **Virtualize KanjiGrid** for 2,136 tiles (currently DOM-heavy on low-end
  devices). Use a simple windowing approach.
- **Bundle budget.** Add a `size-limit` CI step to catch regressions
  (e.g. < 300KB JS gzipped, < 2MB total kanji data per grade).

---

## 10. Build, Data, and Deployment

- **Stop shipping a separate `build:data` step in CI**; cache the generated
  JSON in the repo (or in an artifact) and only re-run when KanjiDic2 /
  KanjiVG versions change. Saves ~30s + an external download per deploy.
- **Pin upstream data versions** explicitly (KanjiDic2 release date,
  KanjiVG tag) in a `data.lock.json`; today the script has a hard-coded
  KanjiVG tag and a mutable KanjiDic URL.
- **PR previews** via `actions/deploy-pages` per-branch (or Cloudflare Pages
  if Pages limits are hit).
- **Lighthouse CI** as a non-blocking job; track PWA / a11y / perf scores
  over time.
- **Release notes** auto-generated from Conventional Commits + surfaced
  inside the app via the existing
  [UpdatePrompt.tsx](../src/components/ui/UpdatePrompt.tsx) ("See what's
  new").

---

## 11. Phased Roadmap

Sequencing favours quick wins that unblock motivation and content depth.

### Phase A — Foundations & first-impression (2 weeks)
*Goal: nobody bounces in the first 5 minutes.*
1. Mode rename + smart empty states + 3-step onboarding (T1).
2. IndexedDB v2 migration scaffolding + `suspended` flag + leech detection
   stub (T6).
3. Surface session score in `SessionSummary` (T2.5.1).
4. Playwright E2E baseline: onboarding, first session, export, theme
   switch (T6).
5. Theme toggle in header, `prefers-reduced-motion` audit (T1, T6).

**Exit criteria:** New user reaches first review in < 60s; empty queue
never silently no-ops; CI green with Playwright.

### Phase B — Motivation loop (2–3 weeks)
*Goal: users feel progress every single session.*
1. XP + level system + Sensei ranks (T2.5.2).
2. Streak-freeze tokens + visual escalation (T2.5.3).
3. Achievements 2.0 (T2.5.4).
4. Per-rating "+XP" micro-interaction, level-up modal, confetti on
   session complete (T2.5.1, T1.4.2).
5. 3D card flip (T1.4.2).

**Exit criteria:** Every session ends with a visible reward; streak chip
tells a story.

### Phase C — Content depth (3–4 weeks)
*Goal: each kanji becomes a place to dwell, not a tile to flip past.*
1. JMdict vocabulary pipeline + `Examples` section in detail view (T3.6.1).
2. JLPT N5–N1 mapping across data + UI (T3.6.6).
3. Look-alike clusters + smarter distractors (T3.6.5).
4. Radical/component graph viewer (T3.6.4).
5. TTS audio behind setting (T3.6.3).
6. New quiz mode: sentence cloze (depends on vocab).

**Exit criteria:** Detail view answers the question "why does this kanji
exist and how is it used?"; quiz pool grows by one mode.

### Phase D — Customization & paths (2 weeks)
*Goal: power users can carve their own curriculum.*
1. Custom decks (CRUD + queue source) (T4.8).
2. Alternative learning paths (radical-first, JLPT-first,
   stroke-count) (T4.8).
3. Lesson grouping with checkpoint XP (T4.8).
4. Per-grade new-card cap, pause-SRS, undo-last-review (T3.1).

**Exit criteria:** A user can create "JLPT N3 only, 5/day" and a
"radical-first beginner" deck side-by-side.

### Phase E — Insight & polish (2 weeks)
*Goal: turn 6 months of review logs into self-knowledge.*
1. Weakest-20 + drill, per-mode accuracy, card-history modal (Section 7).
2. Mobile-first nav redesign + swipe gestures (T1.4.3).
3. User-editable mnemonics + sanitized markdown (T3.6.2).
4. Lighthouse CI + bundle budget (Section 10).

**Exit criteria:** Dashboard answers "what should I work on?"; mobile
≤360px feels first-class; Lighthouse PWA + a11y ≥ 95.

### Phase F — Stretch (ongoing)
- Listening mode (depends on audio breadth).
- Daily quests rotation.
- Additional UI languages.
- Curated mnemonic library.
- Time-attack mini-game with separate scoreboard.

---

## 12. Cross-cutting Conventions for This Roadmap

- **No backend.** All features must remain client-only and PWA-friendly.
- **Privacy-first.** No telemetry, no third-party trackers; new external
  assets must clear CSP and license checks.
- **TypeScript strict + no `any`.** New modules ship with unit tests where
  logic is non-trivial.
- **Schema changes always bump IndexedDB version + ship a migration.**
- **Every new content source documented in [README.md](../README.md)
  attribution section** with license.
- **Each phase ends with:** a CHANGELOG entry, updated screenshots in
  README, and a PLAN.md status sync.

---

## 13. Open Questions

1. **Audio licensing.** Web Speech API is free but inconsistent. Do we
   want to host a curated voice set, and if so under which license budget?
2. **Mnemonic provenance.** Ship a curated set (legal review needed) or
   stay user-editable only?
3. **Cloud sync.** Currently out of scope. Is a future opt-in
   (e.g. Supabase or a self-hosted endpoint) acceptable, or does the
   project commit to permanently zero-backend?
4. **Streak strictness.** Should streak require a minimum review count
   (e.g. 5) or any review at all? Affects perceived fairness.
5. **Gamification opt-out.** Some users prefer pure SRS without XP/levels
   — should this be a global setting from day one?

These should be resolved before Phase B (gamification) and Phase C
(content) start in earnest.
