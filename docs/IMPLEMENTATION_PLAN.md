# Kanji Renshū — Implementation Plan

**Status:** Phase A–D complete · Phase E next
**Companion:** [IMPROVEMENT_PLAN.md](IMPROVEMENT_PLAN.md) (the "what" and "why")
**This doc:** the "how" — concrete, ordered, file-level tasks ready to pick up.

Each task is sized to a single PR (≤ ~400 LOC of diff where possible) and lists:
- **Files** to create/edit
- **Acceptance criteria** (testable)
- **Dependencies** on earlier tasks
- **Estimated size** S (≤ half day) / M (1–2 days) / L (3+ days)

Tasks are numbered `<phase>.<n>` and can be turned 1:1 into GitHub issues.

---

## Conventions for every task

- Branch name: `feat/<short-slug>` or `fix/<short-slug>`.
- Each PR ships: code + tests + (if user-visible) a line in `CHANGELOG.md`.
- TypeScript strict; no `any`. Prefer `unknown` + narrowing.
- Use `import type { ... }` for type-only imports.
- New modules under `src/core/**` ship Vitest tests in the same folder.
- New components ship a basic RTL render test.
- Any IndexedDB schema change → bump version in [db.ts](../src/core/storage/db.ts) **and** add a migration step (see task A.2).
- Any new external asset/URL → update CSP in [index.html](../index.html).
- Any new content source → add an attribution row in [README.md](../README.md).

---

## Phase A — Foundations & First Impression

**Status:** ✅ Complete

**Goal:** A new visitor reaches their first review in < 60 s, never sees a
silently broken button, and the codebase is ready to evolve safely.

Post-mortem: several tasks turned out to be already partially implemented
in the codebase (A.1 labels, A.3 empty-state plumbing, A.4 onboarding shell,
A.6 theme toggle, A.8 scoring). The phase primarily *verified* those, added
the missing scaffolding (migrations, error boundary, Playwright suite),
and filled the small gaps (skip button on onboarding, shared-queue banner,
persistent rating tooltip with session counter, reduced-motion override,
aria-label on settings button).

### A.1 — Rename modes to plain English  (S)
- **Files:** [src/core/learning/quiz-modes.ts](../src/core/learning/quiz-modes.ts), [src/i18n/en.ts](../src/i18n/en.ts), [src/i18n/fr.ts](../src/i18n/fr.ts), affected components in `src/components/study/` and `src/components/home/`.
- **Change:** "Recognition" → "Flashcards". Add a one-line subtitle per mode.
  Internal `QuizMode` string union stays the same; only labels change.
- **Acceptance:**
  - Home page mode cards show new labels in EN and FR.
  - No occurrence of the user-facing word "Recognition" remains in source
    (`grep -r "Recognition" src/components` returns 0).
  - Existing tests pass.

### A.2 — IndexedDB migration scaffolding  (M)
- **Files:** [src/core/storage/db.ts](../src/core/storage/db.ts), new `src/core/storage/migrations.ts`, new `src/core/storage/migrations.test.ts`.
- **Change:** Extract the `upgrade` callback into an ordered migrations array
  `[{from: 0, to: 1, run: (db, tx) => …}, …]`. Bump `DB_VERSION` to **2**
  (no-op migration v1→v2 to prove the pipeline). Add a test that opens a
  v1 DB seeded with one card and asserts it is readable after upgrade.
- **Acceptance:**
  - Existing users open v1 → silently upgraded to v2 with no data loss.
  - Adding a future migration is a single array entry.
  - Test for v1→v2 round-trip passes.

### A.3 — Smart empty states everywhere  (M)
- **Depends on:** none (queue infra already returns `QueueStatus.reason`).
- **Files:** [src/components/review/EmptyState.tsx](../src/components/review/EmptyState.tsx) (extend), entry points in `src/components/home/HomePage.tsx`, `src/components/review/ReviewSession.tsx`, all three quiz sessions in `src/components/study/`.
- **Change:** Every "Start <mode>" path checks `queueStatus.reason` *before*
  navigating. If the queue is empty, render the existing `EmptyState` with
  a `reason`-specific copy + CTA (e.g. `'daily-limit'` → "Come back
  tomorrow or raise your daily cap"). Mode buttons must never silently
  no-op.
- **Acceptance:**
  - Manually setting `dailyNewCards: 0` and clicking each mode shows a
    helpful message, never a blank screen.
  - New unit test on a helper `getEmptyStateCopy(reason, t)` covering all
    five `reason` values.

### A.4 — 3-step onboarding flow  (M)
- **Depends on:** A.1 (uses new mode labels).
- **Files:** rewrite [src/components/onboarding/Onboarding.tsx](../src/components/onboarding/Onboarding.tsx) and its CSS module; new `src/components/onboarding/PaceStep.tsx`; i18n keys in `en.ts`/`fr.ts`.
- **Change:** Three steps — (1) Welcome ("2,136 kanji, your pace"), (2) Choose
  Pace (presets: Casual 5 / Standard 10 / Intense 20, writes
  `dailyNewCards`), (3) How It Works (mini-explainer of FSRS + queue
  sharing). "Skip" button on every step. Mark onboarded on finish or skip.
- **Acceptance:**
  - First-run user sees three slides, can pick a pace.
  - `dailyNewCards` in localStorage matches the chosen preset.
  - Returning users (`isOnboarded() === true`) skip it.
  - RTL test: render → click through → assert settings updated.

### A.5 — Persistent rating tooltip & queue-sharing banner  (S)
- **Files:** [src/components/onboarding/RatingTooltip.tsx](../src/components/onboarding/RatingTooltip.tsx), new `src/components/home/SharedQueueBanner.tsx`.
- **Change:** Show rating tooltip for the first **5** sessions
  (counter `seenRatingTooltipSessions` in localStorage). Show
  "All study modes share the same SRS queue" dismissable banner on home
  until dismissed (`localStorage` flag).
- **Acceptance:**
  - Tooltip auto-hides at session 6.
  - Banner stays dismissed across reloads.

### A.6 — Theme toggle in header  (S)
- **Files:** [src/components/layout/Header.tsx](../src/components/layout/Header.tsx) and CSS, [src/hooks/useTheme.ts](../src/hooks/useTheme.ts).
- **Change:** Add a sun/moon icon button cycling dark → light → system.
  Move the same control out of Settings (or leave it in both).
- **Acceptance:**
  - Click toggles theme without page reload.
  - Choice persists in localStorage.
  - Respects `prefers-color-scheme` on "system".

### A.7 — `prefers-reduced-motion` audit  (S)
- **Files:** [src/styles/animations.css](../src/styles/animations.css), all component CSS using transitions.
- **Change:** Wrap all non-essential transitions in
  `@media (prefers-reduced-motion: no-preference) { … }` or add an
  override block that zeroes them.
- **Acceptance:**
  - DevTools "Emulate reduced motion" disables card-flip, page transitions,
    confetti.
  - No visual regression at default motion preference.

### A.8 — Surface session score in Summary  (S)
- **Depends on:** none (`core/srs/scoring.ts` already exists).
- **Files:** [src/components/review/SessionSummary.tsx](../src/components/review/SessionSummary.tsx) and CSS, [src/core/srs/scoring.ts](../src/core/srs/scoring.ts) (export helpers if needed).
- **Change:** Render base / accuracy bonus / speed bonus / streak
  multiplier / total. Include personal-best chip from
  `localStorage["kanji-renshuu-scores"]`.
- **Acceptance:**
  - After a session, summary shows non-zero score and updates personal best.
  - Snapshot/RTL test for the new section.

### A.9 — Playwright E2E baseline  (M)
- **Depends on:** A.4 (onboarding final shape).
- **Files:** new `playwright.config.ts`, `e2e/onboarding.spec.ts`,
  `e2e/first-session.spec.ts`, `e2e/export-import.spec.ts`,
  `e2e/theme-toggle.spec.ts`. Update [.github/workflows/deploy.yml](../.github/workflows/deploy.yml).
- **Change:** Add `npm run test:e2e` (Playwright) wired into CI as a
  separate job after `npm run build`. Use the built `dist/` served by
  `vite preview`.
- **Acceptance:**
  - CI runs all four specs green on PR.
  - Local `npm run test:e2e` works headed and headless.

### A.10 — App-root error boundary  (S)
- **Files:** new `src/components/ui/ErrorBoundary.tsx`, wire into [src/App.tsx](../src/App.tsx).
- **Change:** Catch render errors, show a friendly screen with
  "Reload" + "Export my data" + "Reset cards" actions.
- **Acceptance:**
  - Throwing a test error from a child renders the fallback, not a white
    screen.
  - "Export my data" downloads the same JSON as Settings → Data.

**Phase A exit criteria:**
- A.1–A.10 merged.
- Lighthouse PWA + Accessibility ≥ 90 locally.
- CI pipeline: typecheck → lint → unit → build → e2e all green.
- New-user time-to-first-review measured manually < 60 s.

---

## Phase B — Motivation Loop

**Goal:** Every session ends with a visible reward; streak chip tells a story.

### B.1 — XP store + level curve  (M)
- **Files:** new `src/core/gamification/xp.ts`, new `src/core/gamification/xp.test.ts`, schema bump in [db.ts](../src/core/storage/db.ts) (new store `userStats`).
- **Change:** `addXp(amount)` / `getLifetimeXp()` / `getLevel()` /
  `xpForNextLevel()`. Curve `level = floor(sqrt(xp / 100))`. Hooked in
  `processReview()` so each rating awards `score`-derived XP.
- **Acceptance:**
  - Unit tests cover curve, persistence, idempotency on import.
  - Importing v1 backup populates `userStats` with computed XP from logs.

### B.2 — Level + Sensei rank UI  (M)
- **Depends on:** B.1.
- **Files:** repurpose [src/components/progress/LevelProgress.tsx](../src/components/progress/LevelProgress.tsx), new `src/components/gamification/RankBadge.tsx`, new modal `src/components/gamification/LevelUpModal.tsx`.
- **Change:** Header shows current level + rank chip. Dashboard shows XP
  bar to next level. On level-up, show full-screen modal with new rank
  title (Apprentice / Student / Adept / Scholar / Master / Sage).
- **Acceptance:**
  - Crossing a level threshold mid-session triggers modal exactly once.
  - Modal dismissable; level state survives reload.

### B.3 — Per-rating XP micro-interaction  (S)
- **Depends on:** B.1.
- **Files:** [src/components/review/RatingButtons.tsx](../src/components/review/RatingButtons.tsx), new `src/components/ui/FloatingNumber.tsx`.
- **Change:** Floating "+N" number rises from rating button with a
  fade-out, sized to `prefers-reduced-motion`.

### B.4 — Streak-freeze tokens  (M)
- **Files:** schema bump (`userStats.freezes`), [src/core/srs/streak.ts](../src/core/srs/streak.ts) (new), [src/components/layout/StatusBar.tsx](../src/components/layout/StatusBar.tsx).
- **Change:** Earn 1 freeze per 7-day streak (max 3). On a missed day,
  auto-spend a freeze if available; otherwise streak resets. Show token
  count in StatusBar.
- **Acceptance:**
  - Unit tests: streak math with/without freezes across day boundaries.
  - Manual: simulate skipping a day → freeze decremented, streak preserved.

### B.5 — Streak visual escalation  (S)
- **Depends on:** B.4.
- **Files:** StatusBar + new `src/components/layout/StreakChip.tsx`.
- **Change:** 🔥 at ≥3 d, blue flame at ≥30, rainbow at ≥100, diamond at
  ≥365. SVG icons, color-blind safe (icon shape changes too).

### B.6 — Achievements 2.0  (L)
- **Files:** new `src/core/gamification/achievements.ts` (declarative
  rules), tests, schema bump (`achievements` store), rewrite
  [src/components/progress/AchievementGallery.tsx](../src/components/progress/AchievementGallery.tsx).
- **Change:** Five families (Milestones / Mastery / Skill / Persistence /
  Exploration). Each rule is `{ id, family, predicate(stats) → 0..1,
  unlockedAt? }`. Evaluate after every review; show unlocked / progress /
  locked states with target.
- **Acceptance:**
  - All existing milestone achievements migrated.
  - Five new achievements (one per family) shipped.
  - Unit tests per predicate.

### B.7 — 3D card flip + confetti on session complete  (S)
- **Files:** [src/components/review/FlashCard.tsx](../src/components/review/FlashCard.tsx) + CSS, [src/components/review/SessionSummary.tsx](../src/components/review/SessionSummary.tsx), tiny inline confetti util in `src/utils/confetti.ts`.
- **Change:** `transform: rotateY()` + `transform-style: preserve-3d`.
  Confetti only on perfect or milestone sessions; respects reduced motion.

**Phase B exit criteria:** Score visible, XP/level wired, streak chip
with freeze + escalation, achievements 2.0 live.

---

## Phase C — Content Depth

**Goal:** Each kanji becomes a place to dwell.

### C.1 — JLPT N5–N1 mapping  (M)
- **Files:** [scripts/build-data.ts](../scripts/build-data.ts) (add lookup), new `scripts/data/jlpt-overrides.json`, [src/components/browse/FilterBar.tsx](../src/components/browse/FilterBar.tsx), [src/components/progress/GradeJourney.tsx](../src/components/progress/GradeJourney.tsx).
- **Change:** Add `jlptN: 1|2|3|4|5|null` to `KanjiEntry` (keep legacy
  `jlpt` for one release). Source: Tanos lists with curated overrides.
  Filter UI labels become N5–N1.

### C.2 — JMdict vocabulary pipeline  (L)
- **Files:** new `scripts/build-vocab.ts`, output `src/data/vocab-g{N}.json`, new `src/data/vocab-loader.ts`, type `VocabExample`.
- **Change:** Download JMdict, index by kanji literal, keep top 5 by
  `common` flag + frequency. Lazy-load by grade.
- **Acceptance:**
  - Build emits ≥ 3 examples for ≥ 95% of kanji.
  - Loader keeps bundle impact < 1 MB per grade.

### C.3 — Examples section in detail view  (S)
- **Depends on:** C.2.
- **Files:** [src/components/study/KanjiDetail.tsx](../src/components/study/KanjiDetail.tsx) and CSS.
- **Change:** New "Examples" section listing word, reading, meaning;
  click to play TTS (if C.5 done).

### C.4 — Sentence cloze quiz mode  (M)
- **Depends on:** C.2.
- **Files:** new `src/components/study/ClozeQuizSession.tsx` and CSS, register mode in [quiz-modes.ts](../src/core/learning/quiz-modes.ts), home page card.
- **Change:** Show example sentence with target kanji blanked; pick from
  4 candidates (1 correct + 3 distractors via existing
  distractor logic).

### C.5 — TTS audio toggle  (S)
- **Files:** new `src/utils/tts.ts`, settings UI in [src/components/settings/SettingsPage.tsx](../src/components/settings/SettingsPage.tsx).
- **Change:** Wrap `speechSynthesis` with `lang: 'ja-JP'`. Settings
  toggle (default off). Speaker icon next to readings in detail view
  and review front (post-flip).

### C.6 — Look-alike clusters  (M)
- **Files:** new `scripts/build-lookalikes.ts`, output `src/data/lookalikes.json`, integration in [src/components/study/KanjiDetail.tsx](../src/components/study/KanjiDetail.tsx) and meaning quiz distractor selection.
- **Change:** Cluster by shared radical + |strokeCount delta| ≤ 1. Show
  "Often confused with" in detail; meaning quiz prefers same-cluster
  distractors when available.

### C.7 — Radical/component graph viewer  (M)
- **Files:** new `src/components/study/ComponentGraph.tsx` + CSS, helper `src/core/learning/components.ts`.
- **Change:** Render the kanji → its components → each component's
  meaning, depth ≤ 2. Inline SVG tree.

**Phase C exit criteria:** Detail view answers "what does this kanji
mean and how is it used?"; quiz pool grows by one mode; JLPT migration
complete.

---

## Phase D — Customization & Paths

### D.1 — `decks` IndexedDB store + CRUD  (M)
- **Files:** schema bump, new `src/core/storage/decks.ts` + tests.
- **Change:** `Deck = { id, name, color, filter, createdAt }` where
  `filter` reuses the browse `FilterSpec`.

### D.2 — Decks UI + selectable as queue source  (M)
- **Depends on:** D.1.
- **Files:** new `src/components/decks/DeckList.tsx`, `DeckEditor.tsx`,
  modify `buildReviewQueue()` to accept an optional `deckFilter`.
- **Acceptance:** Creating a deck "JLPT N3 only" and starting a session
  pulls only matching cards.

### D.3 — Alternative learning paths  (M)
- **Files:** new `src/core/learning/paths.ts` with strategies
  `byGrade`, `byJlpt`, `byFrequency`, `radicalFirst`,
  `byStrokeCount`. Setting in Settings → SRS.

### D.4 — Lesson grouping with checkpoint XP  (S)
- **Files:** [src/core/srs/session.ts](../src/core/srs/session.ts), new
  helper `core/learning/lessons.ts` grouping every 5 newly-introduced
  kanji into a "lesson". XP bonus on completion.

### D.5 — Per-grade new-card cap, pause-SRS, undo-last-review  (M)
- **Files:** Settings UI + [src/core/srs/session.ts](../src/core/srs/session.ts) for caps, [src/core/srs/scheduler.ts](../src/core/srs/scheduler.ts) for pause flag, undo helper using last `ReviewLogEntry`.

**Phase D exit criteria:** Power user can build a custom deck, switch to
radical-first, and undo a misclick.

---

## Phase E — Insight & Polish

### E.1 — Weakest-20 + drill  (S)
- **Files:** new `src/components/progress/WeakestCards.tsx`, helper in [useProgress.ts](../src/hooks/useProgress.ts).
- **Change:** Compute by lowest 30-day retention; "Drill these" builds an
  ad-hoc queue.

### E.2 — Per-mode accuracy chart  (S)
- **Files:** Dashboard + tiny inline-SVG bar component.

### E.3 — Card-history modal  (M)
- **Files:** new `src/components/study/CardHistoryModal.tsx`. Reads
  `reviewLogs` filtered by `kanjiLiteral`. Timeline + retention curve.

### E.4 — Mobile nav redesign + swipe gestures  (M)
- **Files:** [src/components/layout/BottomNav.tsx](../src/components/layout/BottomNav.tsx), new `src/hooks/useSwipe.ts`, integrate into [src/components/review/FlashCard.tsx](../src/components/review/FlashCard.tsx).
- **Change:** 4-icon nav with overflow tray ≤360px; left/right/up/down
  swipes map to Again/Good/Easy/Hard, mirrored via setting.

### E.5 — User-editable mnemonics  (M)
- **Files:** schema bump (`notes` store), new `src/components/study/MnemonicEditor.tsx`, sanitize via [src/utils/sanitize.ts](../src/utils/sanitize.ts).
- **Change:** Markdown allowed (subset), shown in detail view and on
  review back.

### E.6 — Lighthouse + bundle budget in CI  (S)
- **Files:** [.github/workflows/deploy.yml](../.github/workflows/deploy.yml), new `lighthouserc.json`, add `size-limit` config.
- **Change:** Non-blocking job for both; PRs comment with results.

**Phase E exit criteria:** Dashboard answers "what should I work on?";
mobile ≤360px feels first-class; Lighthouse PWA + a11y ≥ 95.

---

## Phase F — Stretch (ongoing, opportunistic)

- F.1 Listening mode (depends on audio breadth).
- F.2 Daily quests rotation.
- F.3 Additional UI languages (ES, DE, PT).
- F.4 Curated mnemonic library (legal review needed).
- F.5 Time-attack mini-game with separate scoreboard.

---

## Sequencing & Parallelization

```
A.1 ─┐
A.2 ─┼─► A.3 ─► A.4 ─► A.5
A.6 ─┘                  │
A.7  (parallel)         │
A.8  (parallel)         │
A.10 (parallel)         ▼
                       A.9  ─────► Phase A done

B.1 ─► B.2 ─► B.3
        │
        └─► B.6
B.4 ─► B.5
B.7  (parallel)        ─────► Phase B done

C.1 ─► (unblocks JLPT-aware features in D)
C.2 ─► C.3, C.4
C.5  (parallel)
C.6, C.7 (parallel)    ─────► Phase C done
```

Within a phase, anything not on the critical path can be parallelized
across contributors. Across phases, **A must complete before B**
(scoring UI, motion guards, error boundary are foundations); **B and C
can overlap** once A.2 (migrations) is in.

---

## Tracking

- Convert each task above into a GitHub issue with the same id
  (`A.1`, `A.2`, …) in the title.
- Group issues into a Project board with columns: **Backlog → In
  progress → Review → Done**, one swimlane per phase.
- Each PR description references the task id and ticks the
  acceptance-criteria checklist.
- Update this file's status header when a phase exits.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| IndexedDB migration corrupts user data | A.2 ships first; every later schema change goes through migrations + a fixture-based test. |
| JMdict pipeline blows up bundle | C.2 exit criterion measures per-grade size; fall back to top-3 examples if > 1 MB. |
| Web Speech TTS quality varies wildly | Ship behind a setting (default off) and gate listening mode (F.1) on a follow-up curated voice set. |
| Gamification feels coercive | Single Settings toggle "Show XP & achievements" (default on) added in B.2. |
| Playwright flakiness in CI | Use `vite preview` deterministic build; retry: 1; per-test timeout 30 s. |

---

## First PRs to open this week

To kick off Phase A immediately, open PRs in this order:

1. **A.2** — IndexedDB migration scaffolding (unblocks every later schema change).
2. **A.1** — Mode rename (cheap, user-visible).
3. **A.3** — Smart empty states (highest UX impact for the cost).
4. **A.10** — Error boundary (safety net for everything that follows).
5. **A.8** — Score in summary (first step of the motivation loop).

Everything else in Phase A can fan out from there.
