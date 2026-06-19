# Research: Exercise Analytics

**Feature**: 019-exercise-analytics | **Date**: 2026-06-19

All spec-level unknowns were resolved during `/speckit.clarify` (see spec §Clarifications).
This document records the technical decisions for implementation. No `NEEDS CLARIFICATION`
markers remain.

## 1. Charting library for the wind rose

- **Decision**: Use `@mui/x-charts@9.5.0` `RadarChart` (from `@mui/x-charts/RadarChart`)
  for the muscle-group wind rose, and `LineChart` (from `@mui/x-charts/LineChart`) for the
  customizable and strength-progress charts.
- **Rationale**: `@mui/x-charts` is already a dependency and the 017 eRM chart established
  the `LineChart` pattern (band x-axis, `series[]`, `width: '100%'`, `connectNulls: false`).
  `RadarChart` ships in the installed v9.5.0 (verified: `node_modules/@mui/x-charts/RadarChart`
  exists), so no new dependency is needed. It accepts `radar={{ metrics: string[] }}` and
  `series=[{ data: number[] }]`, which maps directly to one spoke per muscle group.
- **Alternatives considered**: Adding `recharts`/`nivo` (rejected — new dependency, violates
  Principle V simplicity and duplicates charting); hand-rolled SVG polar chart (rejected —
  more code, worse accessibility/tooltips than the MUI primitive).

## 2. Time-window computation (rolling Week/Month/Year)

- **Decision**: A new pure util `src/utils/analytics/timeWindows.ts` computes rolling
  window bounds as ISO `YYYY-MM-DD` strings (last 7 / 30 / 365 days ending today) and a
  `weeklyBucketsSince(firstIso)` helper that yields consecutive 7-day `[startIso, endIso]`
  ranges from the first logged workout's week through the current week for the
  strength-progress line (all weeks with data).
- **Rationale**: `workout_date` is stored as an ISO `YYYY-MM-DD` text column, so string
  comparison (`workout_date >= ?`) is correct and index-friendly — the same approach the
  017 chart already uses for its month/year cutoffs. Keeping window math in one pure file
  matches Principle VIII and keeps strategies free of date logic.
- **Alternatives considered**: Calendar-boundary weeks/months (rejected in clarification —
  rolling chosen); a date library like `date-fns` (rejected — not a dependency; native
  `Date` arithmetic on local dates is sufficient and matches `dateGroup.ts`).

## 3. Reading set-level data for analytics

- **Decision**: Add a read-only `analyticsRepository` (`src/db/entities/analytics/
  repository.ts`) with two parameterized pivot-free queries:
  (a) `listSetRowsInRange(startIso, endIso)` → one row per set joined with
  `exercise.classification`; (b) `listMuscleGroupSetRowsInRange(startIso, endIso)` → set
  rows joined through `exercise_muscle_group` → `muscle_group` (id, name, color), so each
  set appears once per muscle group it belongs to. Both are exposed via thin `database.ts`
  helpers and adapted to `AnalyticsSession[]` by `fromWorkouts.ts`.
- **Rationale**: The existing `listWorkoutsByExerciseName` returns a per-row Set1..Set5
  pivot — perfect for the **customizable chart** (US1) and reused as-is there. But the
  strength score (US2) and wind rose (US3) need set-level rows across *all* exercises and
  the muscle-group mapping, which the pivot doesn't carry. Row-per-set queries are simpler
  to aggregate in the strategy layer than re-parsing a pivot. Raw parameterized SQL via the
  typed promiser generic (`promiser<Row>('exec', …)`) follows the repo's established pattern
  for joins the Drizzle builder can't express cleanly.
- **Alternatives considered**: Reusing the wide pivot everywhere (rejected — loses muscle
  groups, awkward to sum across exercises); computing everything in SQL (rejected — the
  strategy pattern must own the formulas so they stay swappable; SQL would hard-code them).

## 4. Effective weight for volume (bodyweight handling)

- **Decision**: The `fromWorkouts.ts` adapter computes each set's `effectiveWeight` via the
  existing `computeEffectiveWeight({ bodyWeight, classification, loggedWeight })`, reading
  the current body weight once from `getBodyWeight()`. eRM values are read straight from the
  stored `workout_set.erm` column (already bodyweight-aware).
- **Rationale**: Reuses the single source of truth for effective weight (`utils/erm.ts`) so
  bodyweight sets contribute to training volume (wind rose) consistently with how the app
  already computes load elsewhere. Historical body weight is not tracked, so current body
  weight is the only available value — acceptable since volume is a coarse balance metric
  and eRM (the strength metric) is already frozen at log time.
- **Alternatives considered**: Storing a per-set effective weight column (rejected — schema
  change for a derived value, violates Principle III intent and is unnecessary); ignoring
  bodyweight sets in volume (rejected — under-counts bodyweight-heavy training, contradicts
  FR-019/edge cases).

## 5. Placement of the Analytics tab and home banner

- **Decision**: Analytics is a **third sub-view tab** in the existing `ExerciseLibrary`
  container (`SubView = 'exercises' | 'muscle-groups' | 'analytics'`); the add-FAB is hidden
  when the analytics tab is active. The strength indicator is a `StrengthBanner` component
  mounted at the top of `WorkoutsView` (the `/log` route, which is the app's default/home
  screen).
- **Rationale**: `ExerciseLibraryView` already renders MUI `Tabs`; adding a tab is the
  literal reading of "analytics tab under exercises page" and avoids a new route. `/log` is
  where the router redirects `/`, so it is the de-facto home screen for the banner (FR-015).
- **Alternatives considered**: A dedicated `/exercises/analytics` route (rejected — the page
  already uses in-page tabs; a route would fragment the pattern); a separate top-level nav
  tab (rejected — spec scopes analytics under Exercises).

## 6. Strategy registries (already implemented)

- **Decision**: The calculation layer in `src/utils/analytics/` is already built:
  `sessionErmStrategies` (default `average`), `strengthScoreStrategies` (default
  `sumOfBestErm`), `muscleGroupMetricStrategies` (default `trainingVolume`), plus
  `computeStrengthProgress` / `computeWeekOverWeekChange`. Consumers depend on the registry
  and call `getActive()`/pass a strategy, never a concrete formula.
- **Rationale**: Satisfies the user's "plug-n-play" requirement and the spec defaults from
  clarification. Verified `tsc -b` + ESLint clean.
- **Alternatives considered**: n/a — built per explicit user request prior to planning.
