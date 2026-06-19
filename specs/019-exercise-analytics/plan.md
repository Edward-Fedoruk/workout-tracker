# Implementation Plan: Exercise Analytics

**Branch**: `019-exercise-analytics` | **Date**: 2026-06-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/019-exercise-analytics/spec.md`

## Summary

Add an **Analytics** tab to the Exercises area with three views, plus a strength-progress
banner on the home (`/log`) screen:

1. **Customizable exercise chart** (US1) — pick an exercise and one+ parameters (per-set
   reps/weight/eRM for Set 1–5, plus an aggregate "Overall eRM" = mean of a session's set
   eRMs); parameters are grouped by unit and rendered as **separate `LineChart`s per type**
   (reps / weight / eRM, up to three), with an All/Year/Month time-range filter.
2. **Weekly strength progress** (US2) — a `LineChart` of a per-week "overall strength"
   score (sum of each exercise's best-set eRM that week) across **all weeks since the first
   logged workout**, and a home-screen banner stating "stronger/weaker by X%" vs. last week.
3. **Muscle-group wind rose** (US3) — a `RadarChart` whose spokes are each muscle group's
   training volume (Σ weight × reps, body weight folded in for bodyweight sets) over a
   rolling Week/Month/Year window.

All calculations route through the already-built swappable strategy registries in
`src/utils/analytics/` (default formulas match the spec clarifications). The feature is
**read-only over existing tables** — no schema change, no migration, no new persistence.
Charting uses `@mui/x-charts` (already a dependency; `LineChart` is the pattern from the
017 eRM chart, `RadarChart` is new but ships in v9.5.0).

## Technical Context

**Language/Version**: TypeScript 5.x, React 19, Vite 7
**Primary Dependencies**: `@mui/material` + `@mui/x-charts@9.5.0` (`LineChart`, `RadarChart`),
`react-router-dom@7` (hash router), Drizzle ORM over `@sqlite.org/sqlite-wasm`
**Storage**: SQLite-WASM persisted to OPFS (in-memory fallback). Reads only — `workout_log`,
`workout_set`, `exercise`, `exercise_muscle_group`, `muscle_group`, `app_setting` (body weight)
**Testing**: None configured (Principle V) — type-checked via `tsc -b`, linted via ESLint
**Target Platform**: Browser PWA, mobile-first (≥320px), cross-origin-isolated
**Project Type**: Single-project local-first SPA (no backend)
**Performance Goals**: Charts render < 1s for a typical user's history; period/parameter
changes update without page reload; no horizontal overflow at 360px (SC-005, SC-007)
**Constraints**: Offline-capable; all DB access async through `database.ts`; parameterized
SQL only; files ≤ ~200 lines; container/presentational split
**Scale/Scope**: Single-user local DB; ≤ 5 sets/session (DB-enforced); one new Analytics
sub-view (3 charts), one home-screen banner, ~2 new read helpers, ~0 schema changes

## Constitution Check

*GATE: evaluated against constitution v1.6.0.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Local-First | ✅ PASS | Read-only over existing SQLite tables. No new persistence layer; no backend. Active-formula selection is in-memory module state, not persisted. |
| II. Single Worker, Single Init | ✅ PASS | New read helpers are added to `database.ts` and call the existing memoized promiser. No component imports sqlite-wasm. |
| III. Schema-Complete Before Ready | ✅ PASS | **No schema change.** No new tables/columns → no `drizzle-kit generate`, no migration. All data already exists. |
| IV. Parameterized SQL Only | ✅ PASS | New range queries use `bind: [...]` with `?` placeholders (date bounds), following the existing pivot-query pattern. |
| V. Simplicity & Explicit Scope | ⚠️ DEVIATION (justified) | Strategy-pattern abstraction exceeds "minimum for the task," but was **explicitly requested by the user** and is required by the spec's swappable-formula intent. No test runner added. See Complexity Tracking. |
| VI. Mobile-First, Adaptive UI | ✅ PASS | Charts use `width: '100%'`, responsive heights, toggle/selector controls ≥44px; verified at narrow viewport before done (FR-003, SC-007). |
| VII. Component Separation | ✅ PASS | Smart container (`index.tsx` + `hooks/`) fetches and computes; dumb `views/` chart components receive props only. |
| VIII. Code Organization | ✅ PASS | New folder-per-component under `src/routes/exercises/Analytics/`; `index.tsx` entry points; `@/` imports; no trivial barrels; utils already split into focused files. |
| IX. Strong TypeScript Types | ✅ PASS | Typed promiser generics for row shapes; strategy registries fully generic; no `any`/`unknown` casts. |

**Result**: PASS with one justified deviation (Principle V). No blocking gate failures.

## Project Structure

### Documentation (this feature)

```text
specs/019-exercise-analytics/
├── plan.md              # This file
├── spec.md              # Feature spec (clarified)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── database-helpers.md   # New read-helper signatures
│   └── components.md         # New component/hook contracts
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── utils/analytics/                      # ALREADY BUILT (strategy pattern)
│   ├── types.ts                          # AnalyticsSet, AnalyticsSession
│   ├── strategyRegistry.ts               # CalculationStrategy + createStrategyRegistry
│   ├── aggregate.ts                      # shared pure helpers
│   ├── sessionErm.ts                     # Overall-eRM strategies (default: average)
│   ├── strengthScore.ts                  # weekly score strategies + week-over-week
│   ├── muscleGroupMetric.ts              # wind-rose metrics (default: trainingVolume)
│   ├── fromWorkouts.ts                   # NEW: DB-row → AnalyticsSession adapter
│   └── timeWindows.ts                    # NEW: rolling 7/30/365 bounds + weekly buckets since first workout
│
├── db/entities/analytics/                # NEW read-only query module
│   └── repository.ts                     # listSetRowsInRange, listMuscleGroupSetRowsInRange
├── database.ts                           # + exported helpers wrapping the above
│
├── routes/exercises/
│   ├── ExerciseLibrary/
│   │   ├── index.tsx                     # MODIFIED: add 'analytics' sub-view
│   │   └── views/ExerciseLibraryView.tsx # MODIFIED: 3rd tab + hide FAB on analytics
│   └── Analytics/                        # NEW feature folder
│       ├── index.tsx                     # smart container (ExerciseAnalytics)
│       ├── hooks/
│       │   ├── useExerciseParameterChart.ts
│       │   ├── useStrengthProgressChart.ts
│       │   └── useMuscleGroupRose.ts
│       └── views/
│           ├── AnalyticsView.tsx         # layout shell for the 3 sections
│           ├── ExerciseParameterChart/index.tsx
│           ├── StrengthProgressChart/index.tsx
│           └── MuscleGroupRose/index.tsx
│
└── routes/workouts/
    ├── views/WorkoutsView.tsx            # MODIFIED: mount StrengthBanner at top
    └── StrengthBanner/                   # NEW
        ├── index.tsx                     # smart: useStrengthProgress + render
        └── hooks/useStrengthProgress.ts
```

**Structure Decision**: Single-project SPA. The Analytics tab is a **third sub-view of the
existing `ExerciseLibrary` container** (which already renders a MUI `Tabs` with
Exercises / Muscle Groups), keeping the "tab under the exercises page" intent literal.
Each chart is a dumb presentational component fed by a dedicated container hook. The
home-screen indicator is a self-contained `StrengthBanner` mounted in `WorkoutsView`.
All math reuses `src/utils/analytics/` strategies; the only new data-layer surface is a
small read-only `analytics` repository plus two `database.ts` helpers.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Strategy-pattern calculation layer (Principle V — abstraction beyond minimum) | Explicitly requested by the user; the spec requires multiple performance/strength/balance formulas to be swappable "plug-n-play" so approaches can be compared without touching call sites | A single hard-coded formula per metric would be fewer files, but would couple every chart and the home banner to one calculation, making the spec's "swap approaches" intent a rewrite each time. The abstraction is contained to pure util files with no runtime cost. |
