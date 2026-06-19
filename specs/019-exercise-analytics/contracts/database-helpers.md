# Contract: Database Helpers — Exercise Analytics

**Feature**: 019-exercise-analytics | **Date**: 2026-06-19

New **read-only** helpers. All go through the memoized promiser, use `?` binds, and are
exported from `src/database.ts` (Principles II & IV). No schema change.

## Repository: `src/db/entities/analytics/repository.ts`

### `listSetRowsInRange(startIso, endIso): Promise<AnalyticsSetRow[]>`

One row per logged set whose session falls in `[startIso, endIso]`, joined with the
exercise classification.

```ts
type AnalyticsSetRow = {
  classification: 'bodyweight' | 'standard';
  ermValue: null | number;   // workout_set.erm
  exerciseName: string;
  isoDate: string;           // workout_log.workout_date
  reps: number;
  setNumber: number;
  weight: null | number;
  workoutId: number;
};
```

SQL shape (parameterized):

```sql
SELECT
  w.id            AS workoutId,
  w.workout_date  AS isoDate,
  w.exercise_name AS exerciseName,
  e.classification AS classification,
  s.set_number    AS setNumber,
  s.reps          AS reps,
  s.weight        AS weight,
  s.erm           AS ermValue
FROM workout_log w
JOIN workout_set s ON s.workout_id = w.id
LEFT JOIN exercise e ON e.name = w.exercise_name
WHERE w.workout_date >= ? AND w.workout_date <= ?
ORDER BY w.workout_date ASC, w.id ASC, s.set_number ASC
```

- `bind: [startIso, endIso]`.
- `classification` defaults to `'standard'` in the adapter when the join misses (a logged
  exercise that was later deleted from the library).

### `listMuscleGroupSetRowsInRange(startIso, endIso): Promise<AnalyticsMuscleGroupSetRow[]>`

As above, **plus** one row per muscle group each set's exercise maps to.

```ts
type AnalyticsMuscleGroupSetRow = AnalyticsSetRow & {
  muscleGroupColor: string;
  muscleGroupId: number;
  muscleGroupName: string;
};
```

SQL adds:

```sql
JOIN exercise_muscle_group emg ON emg.exercise_id = e.id
JOIN muscle_group mg           ON mg.id = emg.muscle_group_id
-- SELECT … , mg.id AS muscleGroupId, mg.name AS muscleGroupName, mg.color AS muscleGroupColor
```

- Sets for exercises with **no** muscle group are excluded from the wind rose (cannot be
  attributed to a spoke).
- An exercise in N groups yields N rows per set (intended — multi-group attribution).

## `src/database.ts` exports

```ts
export const listSetRowsInRange = (startIso: string, endIso: string) =>
  analyticsRepository.listSetRowsInRange(startIso, endIso);

export const listMuscleGroupSetRowsInRange = (startIso: string, endIso: string) =>
  analyticsRepository.listMuscleGroupSetRowsInRange(startIso, endIso);
```

`getBodyWeight()` (existing) is reused by the adapter for effective-weight derivation.
For US1, the **existing** `listWorkoutsByExerciseName(name)` is reused unchanged.

## Adapter: `src/utils/analytics/fromWorkouts.ts`

```ts
// Group flat set rows into sessions, computing effectiveWeight per set.
sessionsFromSetRows(rows: AnalyticsSetRow[], bodyWeight: null | number): AnalyticsSession[];

// Group muscle-group set rows by group, each with its attributed sessions.
musclesFromSetRows(
  rows: AnalyticsMuscleGroupSetRow[],
  bodyWeight: null | number,
): Array<{ color: string; id: number; name: string; sessions: AnalyticsSession[] }>;
```

- `effectiveWeight = computeEffectiveWeight({ bodyWeight, classification, loggedWeight: weight })`.
- Pure functions (no DB import) → keep strategies and adapter independently testable.

## Time windows: `src/utils/analytics/timeWindows.ts`

```ts
type IsoRange = { endIso: string; startIso: string };
type RosePeriod = 'month' | 'week' | 'year';

rollingRange(period: RosePeriod, now?: Date): IsoRange;          // last 7/30/365 days
weeklyBucketsSince(firstIso: string, now?: Date): IsoRange[];    // consecutive 7-day ranges from firstIso's week → current week, oldest→newest (FR-013, all weeks with data)
currentAndPreviousWeek(now?: Date): { current: IsoRange; previous: IsoRange };
```

- Dates formatted as local `YYYY-MM-DD` (consistent with `workout_date` storage and
  `dateGroup.ts`). Pure; no DB or library dependency.

## Invariants

- No new write path; no schema/migration; no second persistence layer.
- Every query is parameterized; no string interpolation.
- Helpers return `[]` for empty ranges (never throw on no-data).
