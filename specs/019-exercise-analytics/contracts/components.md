# Contract: Components & Hooks — Exercise Analytics

**Feature**: 019-exercise-analytics | **Date**: 2026-06-19

Container/presentational split per Principle VII. Smart containers (`index.tsx` + `hooks/`)
fetch and compute; `views/` are dumb chart components. All cross-dir imports use `@/`.

## Tab integration (modified)

### `ExerciseLibrary/index.tsx` + `views/ExerciseLibraryView.tsx`
- Extend `SubView` to `'analytics' | 'exercises' | 'muscle-groups'`.
- Add a third `<Tab label="Analytics" value="analytics" />`.
- Hide the add-FAB when `subView === 'analytics'` (no create action there).
- Render `<ExerciseAnalytics />` when the analytics tab is active.

## `Analytics/index.tsx` — `ExerciseAnalytics` (smart container)

- Orchestrates the three sections; owns no chart logic itself.
- Loads the exercise list (for the US1 picker) and renders `<AnalyticsView>` with the three
  section components, each driven by its own hook.
- Empty/loading: shows a spinner while initial data loads; each section self-handles its
  own empty state.

## Section 1 — Customizable parameter chart (US1)

### Hook `hooks/useExerciseParameterChart.ts`
```ts
type ParameterUnit = 'erm' | 'reps' | 'weight';   // chart grouping (FR-006)
type ParameterKey =
  | `set${1|2|3|4|5}_erm`
  | `set${1|2|3|4|5}_reps`
  | `set${1|2|3|4|5}_weight`
  | 'overallErm';                                  // belongs to the 'erm' unit
type TimeRange = 'all' | 'month' | 'year';         // FR-022, default 'all'

type UnitChart = {
  series: { data: (null | number)[]; id: string; label: string }[];
  unit: ParameterUnit;       // 'reps' | 'weight (kg)' | 'eRM (kg)' axis label
  xDates: string[];
};

useExerciseParameterChart(): {
  availableParameters: { key: ParameterKey; label: string }[];
  charts: UnitChart[];        // one per unit that has ≥1 selected parameter (FR-006)
  exercises: Exercise[];
  selectedExerciseId: number | null;
  selectedParameters: ParameterKey[];   // multi-select
  setSelectedExerciseId: (id: number) => void;
  setTimeRange: (range: TimeRange) => void;
  timeRange: TimeRange;
  toggleParameter: (key: ParameterKey) => void;
};
```
- Loads rows via existing `listWorkoutsByExerciseName(name)` (Set1..Set5 pivot), then filters
  by `timeRange` (reuse the 017 chart's `filterByRange`).
- Each `setN_*` parameter reads the matching pivot column; `overallErm` =
  `sessionErmStrategies.getActive().calculate(sessionSets)` per session.
- **Grouping (FR-006/FR-007)**: selected parameters are bucketed by unit (`reps` / `weight` /
  `erm`, with `overallErm` in `erm`) into up to three `UnitChart`s; only units with a
  selected parameter produce a chart.
- Series only include points where the value is non-null (FR-008); re-validates selected
  parameters against the new exercise on switch (FR-010).

### View `views/ExerciseParameterChart/index.tsx`
- Props: exercise selector value/options + change, parameter multi-select + toggle,
  `charts: UnitChart[]`, `timeRange` + change, empty flag.
- Renders MUI `Select` (exercise), a multi-select (chips/menu) for parameters, an
  All/Year/Month `ToggleButtonGroup` (FR-022), and **one `LineChart` per `UnitChart`**
  (`width: '100%'`, `connectNulls: false`, band x-axis, per-unit y-axis label, legend),
  stacked vertically. Empty state when no exercise/parameters/data.

## Section 2 — Weekly strength progress (US2)

### Hook `hooks/useStrengthProgressChart.ts`
```ts
useStrengthProgressChart(): {
  isEmpty: boolean;
  points: { score: null | number; weekLabel: string }[];  // oldest → newest
};
```
- Shows **all weeks with data** (FR-013): finds the earliest `workout_date`, then builds
  consecutive 7-day buckets from that week through the current week via
  `weeklyBucketsSince(firstIso)`. For each bucket loads `listSetRowsInRange`, adapts via
  `sessionsFromSetRows`, scores with `strengthScoreStrategies.getActive()`.

### View `views/StrengthProgressChart/index.tsx`
- `LineChart` of weekly score over `weekLabel` x-axis; empty state when < 1 scorable week.

## Section 3 — Muscle-group wind rose (US3)

### Hook `hooks/useMuscleGroupRose.ts`
```ts
useMuscleGroupRose(): {
  isEmpty: boolean;
  period: RosePeriod;            // 'week' | 'month' | 'year'
  setPeriod: (p: RosePeriod) => void;
  spokes: { color: string; name: string; value: number }[];
};
```
- On `period` change: `rollingRange(period)` → `listMuscleGroupSetRowsInRange` →
  `musclesFromSetRows` → `muscleGroupMetricStrategies.getActive()` per group (FR-020 immediate).

### View `views/MuscleGroupRose/index.tsx`
- `RadarChart` with `radar={{ metrics: spokes.map(s => s.name) }}` and one series of
  `spokes.map(s => s.value)`; Week/Month/Year `ToggleButtonGroup`. Renders the radar even
  with 1–2 spokes — **no fallback chart type** (FR-023). Empty state only when zero groups
  were trained in the period.

## Home-screen banner (US2)

### `routes/workouts/StrengthBanner/index.tsx` + `hooks/useStrengthProgress.ts`
```ts
useStrengthProgress(): {
  loading: boolean;
  result: WeekOverWeekResult;   // { current, previous, percentChange, direction }
};
```
- `currentAndPreviousWeek()` → two `listSetRowsInRange` loads → `computeStrengthProgress`.
- Banner renders a Material card: `stronger` (positive/up treatment, e.g. success color +
  upward icon), `weaker` (down treatment), `same` (neutral), `insufficient` (neutral
  "Not enough data yet" — no percentage). Mounted at the top of `WorkoutsView`.

## Cross-cutting UI rules

- Mobile-first (Principle VI): every chart `width: '100%'`, no fixed pixel widths, controls
  ≥44px touch target, no horizontal overflow at 360px (SC-007).
- Presentational components hold no DB calls and no strategy imports beyond type usage;
  all fetching/computation lives in hooks (Principle VII).
- Each file ≤ ~200 lines; split a chart's helpers into a co-located util if it grows.
