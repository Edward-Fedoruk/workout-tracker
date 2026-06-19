# Quickstart: Exercise Analytics

**Feature**: 019-exercise-analytics | **Date**: 2026-06-19

How to build the feature on top of the already-implemented strategy layer
(`src/utils/analytics/`). Read alongside `plan.md`, `data-model.md`, and `contracts/`.

## Prerequisites

- Branch `019-exercise-analytics` checked out.
- `src/utils/analytics/` strategy registries already exist and pass `tsc -b` + ESLint.
- `@mui/x-charts@9.5.0` already installed (`LineChart`, `RadarChart`).

## Build order (each step independently verifiable)

### Step 0 — Shared adapters & time windows (foundation)
1. Add `src/utils/analytics/timeWindows.ts` — `rollingRange`, `weeklyBuckets`,
   `currentAndPreviousWeek` (pure, local `YYYY-MM-DD`).
2. Add `src/utils/analytics/fromWorkouts.ts` — `sessionsFromSetRows`,
   `musclesFromSetRows` (use `computeEffectiveWeight`).
3. `npm run lint && npm run typecheck`.

### Step 1 — Read layer
1. Add `src/db/entities/analytics/repository.ts` with `listSetRowsInRange` and
   `listMuscleGroupSetRowsInRange` (parameterized pivot-free SQL via typed promiser).
2. Export both from `src/database.ts`.
3. Verify in the browser console (preview build) that the helpers return rows for a known
   date range.

### Step 2 — US1: Customizable parameter chart (P1, MVP slice)
1. Scaffold the Analytics folder: `Analytics/index.tsx`, `views/AnalyticsView.tsx`.
2. Add `hooks/useExerciseParameterChart.ts` (reuses existing `listWorkoutsByExerciseName`;
   `overallErm` via `sessionErmStrategies`; groups selected parameters by unit into up to 3
   charts; All/Year/Month time filter).
3. Add `views/ExerciseParameterChart/index.tsx` (one `LineChart` **per unit chart**, exercise
   `Select`, parameter multi-select, All/Year/Month `ToggleButtonGroup`).
4. Wire the **third tab** into `ExerciseLibrary` (`SubView += 'analytics'`, hide FAB,
   render `<ExerciseAnalytics />`).
5. **Verify**: pick an exercise with ≥2 sessions, select "Set 1 weight" → one kg chart with a
   line; add "Set 1 reps" → a **second, separate** reps chart appears; add "Set 1 eRM" → a
   third eRM chart; toggle Month/Year and confirm all charts refilter; check no overflow at 360px.

### Step 3 — US2: Strength progress + home banner (P2)
1. Add `hooks/useStrengthProgressChart.ts` + `views/StrengthProgressChart/index.tsx`
   (weekly `LineChart` over **all weeks since the first workout** via `weeklyBucketsSince`
   + `strengthScoreStrategies`).
2. Add `routes/workouts/StrengthBanner/` (`index.tsx` + `hooks/useStrengthProgress.ts`
   using `computeStrengthProgress`); mount at top of `WorkoutsView`.
3. **Verify**: log two weeks where one lift drops and another rises sharply; confirm the
   banner reads "stronger by X%" (net), and the graph shows one point per week. With only
   one week of data, the banner shows the neutral "not enough data" state.

### Step 4 — US3: Muscle-group wind rose (P3)
1. Add `hooks/useMuscleGroupRose.ts` + `views/MuscleGroupRose/index.tsx` (`RadarChart`,
   Week/Month/Year toggle via `rollingRange` + `muscleGroupMetricStrategies`).
2. **Verify**: log exercises across ≥2 muscle groups; confirm one spoke per trained group,
   colored per group (radar renders even with 1–2 spokes — no bar fallback); switching
   Week/Month/Year changes magnitudes; empty period (zero trained groups) → message.

### Step 5 — Polish & gates
1. Confirm empty states on a fresh DB across all three sections + banner.
2. `npm run lint && npm run typecheck` clean; verify at 360px (no horizontal scroll).

## Swapping a formula (plug-n-play demo)

To compare approaches without touching any chart/component code, change the active strategy
once (e.g. at app start or a dev toggle):

```ts
import { strengthScoreStrategies } from '@/utils/analytics/strengthScore';
import { muscleGroupMetricStrategies } from '@/utils/analytics/muscleGroupMetric';

strengthScoreStrategies.setActive('totalVolume');       // was 'sumOfBestErm'
muscleGroupMetricStrategies.setActive('setCount');      // was 'trainingVolume'
```

Every chart and the home banner pick up the new formula on next render because they call
`getActive()` — no call-site changes.

## Acceptance mapping

| Spec | Verified in |
|------|-------------|
| US1 (FR-004–010, SC-001/002) | Step 2 |
| US2 (FR-011–016, SC-003/004) | Step 3 |
| US3 (FR-017–021, SC-005) | Step 4 |
| Empty states / mobile (FR-002/003, SC-006/007) | Step 5 |

## Out of scope (do not add without a decision — Principle V)

- Persisting the user's chosen formula (would need an `app_setting` row).
- A test runner / unit tests for the strategies.
- Historical body-weight tracking for past-session volume.
