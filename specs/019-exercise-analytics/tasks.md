---
description: "Task list for Exercise Analytics"
---

# Tasks: Exercise Analytics

**Input**: Design documents from `/specs/019-exercise-analytics/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No test runner is configured (Constitution Principle V) and none was requested,
so **no test tasks are generated**. Verification is manual (`npm run preview`) plus
`npm run lint` + `npm run typecheck`.

**Organization**: Tasks are grouped by user story for independent implementation/testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 / US2 / US3 (Setup / Foundational / Polish have no story label)

## Path Conventions

Single-project SPA. Source under `src/` at repo root. Each component lives in its own
folder with an `index.tsx` entry point; hooks under `hooks/`, dumb views under `views/`;
all cross-dir imports use the `@/` alias.

> **Already implemented (do not recreate)**: the swappable strategy layer
> `src/utils/analytics/{types,strategyRegistry,aggregate,sessionErm,strengthScore,muscleGroupMetric}.ts`
> exists, is `tsc -b` + ESLint clean, and exposes `sessionErmStrategies`,
> `strengthScoreStrategies`, `muscleGroupMetricStrategies`, `computeStrengthProgress`, and
> `computeWeekOverWeekChange`. All chart hooks consume these via `getActive()`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm prerequisites; no new dependencies needed.

- [X] T001 Confirm `@mui/x-charts/LineChart` and `@mui/x-charts/RadarChart` resolve in `@mui/x-charts@9.5.0` (already installed) — no dependency or config change; if missing, stop and surface before proceeding.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared data layer + Analytics tab scaffold that the user stories build on.

**⚠️ CRITICAL**: The tab scaffold (T006–T007) blocks the in-tab parts of US1/US2/US3. The
data layer (T002–T005) blocks US2 and US3 (US1 reuses the existing
`listWorkoutsByExerciseName` and does **not** depend on T002–T005).

- [X] T002 [P] Create rolling/weekly time-window helpers in `src/utils/analytics/timeWindows.ts` — `rollingRange(period, now?)` (last 7/30/365 days), `weeklyBucketsSince(firstIso, now?)` (consecutive 7-day ranges from first workout's week → current week), `currentAndPreviousWeek(now?)`; pure, local `YYYY-MM-DD` formatting (per contracts/database-helpers.md).
- [X] T003 [P] Create the DB-row → analytics adapter in `src/utils/analytics/fromWorkouts.ts` — `sessionsFromSetRows(rows, bodyWeight)` and `musclesFromSetRows(rows, bodyWeight)`, computing each set's `effectiveWeight` via `computeEffectiveWeight` from `@/utils/erm`; pure (no DB import).
- [X] T004 [P] Create read-only analytics repository in `src/db/entities/analytics/repository.ts` — `listSetRowsInRange(startIso, endIso)` and `listMuscleGroupSetRowsInRange(startIso, endIso)` using parameterized (`?` bind) pivot-free SQL via the typed promiser, per contracts/database-helpers.md.
- [X] T005 Export `listSetRowsInRange` and `listMuscleGroupSetRowsInRange` (and their row types) from `src/database.ts` (depends on T004).
- [X] T006 [P] Create the Analytics tab scaffold: container `src/routes/exercises/Analytics/index.tsx` (`ExerciseAnalytics`, loads exercise list, handles loading) and shell `src/routes/exercises/Analytics/views/AnalyticsView.tsx` rendering three section slots (placeholders until each story fills them).
- [X] T007 Wire the Analytics tab into the Exercises page: extend `SubView` to include `'analytics'` and render `<ExerciseAnalytics />` in `src/routes/exercises/ExerciseLibrary/index.tsx`; add the third `<Tab label="Analytics" value="analytics" />` and hide the add-FAB when analytics is active in `src/routes/exercises/ExerciseLibrary/views/ExerciseLibraryView.tsx` (depends on T006).

**Checkpoint**: Analytics tab opens with an empty shell; data layer is callable.

---

## Phase 3: User Story 1 - Customizable Exercise Parameter Chart (Priority: P1) 🎯 MVP

**Goal**: Pick an exercise and any per-set/aggregate parameters; render them grouped by unit
into separate `LineChart`s (reps / weight / eRM), with an All/Year/Month time filter.

**Independent Test**: Open Analytics, pick an exercise with ≥2 sessions, select "Set 1 weight"
→ a kg chart appears; add "Set 1 reps" → a second, separate reps chart appears; add
"Set 1 eRM" → a third eRM chart; toggle Month/Year and confirm all charts refilter; no
horizontal overflow at 360px.

### Implementation for User Story 1

- [X] T008 [P] [US1] Create `src/routes/exercises/Analytics/hooks/useExerciseParameterChart.ts` — load rows via existing `listWorkoutsByExerciseName(name)`, filter by `TimeRange` (reuse the 017 `filterByRange` logic), expose `availableParameters`, `selectedParameters` (multi-select) with re-validation on exercise switch, `timeRange`/`setTimeRange`, and `charts: UnitChart[]` grouped by unit (`reps`/`weight`/`erm`, with `overallErm` via `sessionErmStrategies.getActive()` in the `erm` group); plot only non-null points (FR-006/007/008/010/022).
- [X] T009 [US1] Create `src/routes/exercises/Analytics/views/ExerciseParameterChart/index.tsx` — exercise `Select`, parameter multi-select (chips/menu), All/Year/Month `ToggleButtonGroup`, and one `LineChart` per `UnitChart` (`width:'100%'`, `connectNulls:false`, band x-axis, per-unit y-axis label, legend) stacked vertically; empty state when no exercise/parameters/data (depends on T008).
- [X] T010 [US1] Mount `<ExerciseParameterChart />` in the first slot of `src/routes/exercises/Analytics/views/AnalyticsView.tsx` (depends on T009).

**Checkpoint**: US1 fully functional and independently testable (MVP).

---

## Phase 4: User Story 2 - Week-to-Week Overall Strength Progress (Priority: P2)

**Goal**: A weekly overall-strength `LineChart` (sum of each exercise's best-set eRM per week)
across all weeks since the first workout, plus a `/log` home-screen banner stating
"stronger/weaker by X%" vs. last week.

**Independent Test**: Log two consecutive weeks where one lift drops and another rises sharply;
the banner reads "stronger by X%" (net), the graph shows one point per week. With only one
week of data the banner shows the neutral "not enough data" state.

### Implementation for User Story 2

- [X] T011 [P] [US2] Create `src/routes/exercises/Analytics/hooks/useStrengthProgressChart.ts` — find earliest `workout_date`, build buckets via `weeklyBucketsSince(firstIso)`, load each via `listSetRowsInRange`, adapt with `sessionsFromSetRows` (+ `getBodyWeight()`), score with `strengthScoreStrategies.getActive()`; return ordered weekly `points` + `isEmpty` (FR-011/013, depends on T002/T003/T005).
- [X] T012 [US2] Create `src/routes/exercises/Analytics/views/StrengthProgressChart/index.tsx` — `LineChart` of weekly score over week labels (`width:'100%'`); empty state when < 1 scorable week (depends on T011).
- [X] T013 [US2] Mount `<StrengthProgressChart />` in the second slot of `src/routes/exercises/Analytics/views/AnalyticsView.tsx` (depends on T012).
- [X] T014 [P] [US2] Create `src/routes/workouts/StrengthBanner/hooks/useStrengthProgress.ts` — `currentAndPreviousWeek()` → two `listSetRowsInRange` loads → `sessionsFromSetRows` → `computeStrengthProgress`; return `{ loading, result }` (FR-014/016, depends on T002/T003/T005).
- [X] T015 [US2] Create `src/routes/workouts/StrengthBanner/index.tsx` — Material card rendering `stronger` (success/up treatment), `weaker` (down), `same` (neutral), `insufficient` ("Not enough data yet", no %) from `result.direction`/`percentChange` (FR-015/016, depends on T014).
- [X] T016 [US2] Mount `<StrengthBanner />` at the top of `src/routes/workouts/views/WorkoutsView.tsx` (depends on T015).

**Checkpoint**: US1 and US2 both work independently.

---

## Phase 5: User Story 3 - Muscle Group Balance Wind Rose (Priority: P3)

**Goal**: A `RadarChart` whose spokes are each trained muscle group's training volume over a
rolling Week/Month/Year window; renders even with 1–2 spokes (no fallback).

**Independent Test**: Log exercises across ≥2 muscle groups; one spoke per trained group in its
color; switching Week/Month/Year changes magnitudes; an empty period (zero trained groups)
shows the empty state; a 1–2 group period still renders a radar.

### Implementation for User Story 3

- [X] T017 [P] [US3] Create `src/routes/exercises/Analytics/hooks/useMuscleGroupRose.ts` — `period` state (`'week'|'month'|'year'`); on change `rollingRange(period)` → `listMuscleGroupSetRowsInRange` → `musclesFromSetRows` (+ `getBodyWeight()`) → `muscleGroupMetricStrategies.getActive()` per group; return `spokes`, `period`/`setPeriod`, `isEmpty` (FR-017–020/023, depends on T002/T003/T005).
- [X] T018 [US3] Create `src/routes/exercises/Analytics/views/MuscleGroupRose/index.tsx` — `RadarChart` with `radar={{ metrics: spokes.map(s=>s.name) }}` and one series of values, Week/Month/Year `ToggleButtonGroup`, group colors; render radar even with 1–2 spokes; empty state only when zero trained groups (FR-021/023, depends on T017).
- [X] T019 [US3] Mount `<MuscleGroupRose />` in the third slot of `src/routes/exercises/Analytics/views/AnalyticsView.tsx` (depends on T018).

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Empty states, mobile correctness, and gates across all stories.

- [ ] T020 [P] Verify empty states on a fresh DB: all three Analytics sections and the home banner show clear messages (not errors/blank charts) with zero data (FR-002, SC-006).
- [ ] T021 [P] Verify mobile correctness at 360px: every chart uses full width with no horizontal overflow; controls meet 44×44px touch targets (Principle VI, FR-003, SC-007).
- [X] T022 Run `npm run lint` and `npm run typecheck`; resolve any issues (no `any`/`unknown` casts — Principle IX). Required before commit.
- [ ] T023 Walk through `quickstart.md` verification steps end-to-end on `npm run preview`, including the plug-n-play `setActive(...)` formula-swap demo.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none — start immediately.
- **Foundational (Phase 2)**: after Setup. Tab scaffold (T006–T007) blocks all in-tab UI; data layer (T002–T005) blocks US2 + US3.
- **US1 (Phase 3)**: needs only the tab scaffold (T006–T007) + existing helpers — can start before the data layer is finished.
- **US2 (Phase 4)** and **US3 (Phase 5)**: need the data layer (T002–T005) + tab scaffold; otherwise independent of each other and of US1.
- **Polish (Phase 6)**: after the desired stories are complete.

### Story Dependencies

- US1 (P1): independent (existing pivot helper) → MVP.
- US2 (P2): independent of US1/US3; uses foundational data layer.
- US3 (P3): independent of US1/US2; uses foundational data layer.

### Within Each User Story

- Hook → view → mount (each view depends on its hook; each mount edits `AnalyticsView.tsx`).
- The three `AnalyticsView.tsx` mounts (T010, T013, T019) touch the same file across phases — do them sequentially, not in parallel.

### Parallel Opportunities

- Foundational: T002, T003, T004, T006 are different new files → run in parallel; T005 waits on T004; T007 waits on T006.
- US1 hook (T008), US2 hooks (T011, T014), US3 hook (T017) are different new files → parallelizable once their foundational deps are met.
- Polish T020 and T021 are independent checks → parallel.

---

## Parallel Example: Foundational Phase

```bash
# After T001, launch the independent foundational files together:
Task: "T002 timeWindows.ts"
Task: "T003 fromWorkouts.ts"
Task: "T004 analytics repository.ts"
Task: "T006 Analytics container + AnalyticsView shell"
# Then T005 (database.ts exports, after T004) and T007 (tab wiring, after T006).
```

## Parallel Example: Hooks across stories

```bash
# Once Foundational is done, the story hooks are independent files:
Task: "T008 [US1] useExerciseParameterChart"
Task: "T011 [US2] useStrengthProgressChart"
Task: "T014 [US2] useStrengthProgress (banner)"
Task: "T017 [US3] useMuscleGroupRose"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 (Setup) → Phase 2 tab scaffold (T006–T007).
2. Phase 3 (US1): T008 → T009 → T010.
3. **STOP and VALIDATE**: customizable per-unit charts work end-to-end.
4. Demo. (US1 needs neither the data layer nor the strategy registries beyond `sessionErmStrategies`.)

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 → test → demo (MVP).
3. US2 (strength graph + home banner) → test → demo.
4. US3 (wind rose) → test → demo.
5. Polish.

---

## Notes

- `[P]` = different files, no incomplete-task dependency.
- Strategy registries and aggregation helpers are pre-built — consume, don't recreate.
- No schema change / migration (read-only over existing tables).
- Keep every new file ≤ ~200 lines; extract a co-located util if a chart grows.
- Commit after each task or logical group; lint + typecheck must pass before commit.
